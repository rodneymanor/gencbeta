"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight, FolderPlus } from "lucide-react";

import { CreateCollectionDialog } from "@/app/(main)/research/collections/_components/create-collection-dialog";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";

import { BrandProfileIndicator } from "./brand-profile-indicator";

interface NavMainProps {
  readonly items: readonly NavGroup[];
  readonly onCollectionCreated?: () => void;
}

const IsComingSoon = () => (
  <span className="ml-auto rounded-md bg-gray-200 px-2 py-1 text-xs dark:text-gray-800">Soon</span>
);

const IconWithLabel = ({ item, isBrandItem }: { item: NavMainItem; isBrandItem: boolean }) => (
  <>
    <div className="flex items-center justify-center">
      {item.icon && <item.icon className="transition-transform hover:scale-110" />}
      {isBrandItem && <BrandProfileIndicator />}
    </div>
    {item.displayLabel && (
      <span className="text-muted-foreground text-center text-xs group-data-[collapsible=icon]:sr-only">
        {item.displayLabel}
      </span>
    )}
  </>
);

const NavItem = ({
  item,
  isActive,
  onCollectionCreated,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean;
  onCollectionCreated?: () => void;
}) => {
  const isBrandItem = item.title === "My Brand";

  if (item.subItems) {
    return (
      <SidebarMenuItem key={item.title}>
        <HoverCard openDelay={150} closeDelay={300}>
          <HoverCardTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isActive(item.url, item.subItems)}
              className="flex flex-col items-center gap-1 p-2"
            >
              <div className="flex items-center justify-center">
                {item.icon && <item.icon className="transition-transform hover:scale-110" />}
                {isBrandItem && <BrandProfileIndicator />}
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:hidden hover:scale-110" />
              </div>
              {item.displayLabel && (
                <span className="text-muted-foreground text-center text-xs group-data-[collapsible=icon]:sr-only">
                  {item.displayLabel}
                </span>
              )}
            </SidebarMenuButton>
          </HoverCardTrigger>
          <HoverCardContent className="w-48 space-y-1 p-2" side="right" align="start" sideOffset={8}>
            {item.subItems.map((subItem) => (
              <SidebarMenuSubButton
                key={subItem.title}
                asChild
                className="w-full justify-start"
                isActive={isActive(subItem.url)}
              >
                <Link href={subItem.url} target={subItem.newTab ? "_blank" : undefined}>
                  {subItem.icon && <subItem.icon className="h-4 w-4 transition-transform hover:scale-110" />}
                  <span>{subItem.title}</span>
                </Link>
              </SidebarMenuSubButton>
            ))}
            {item.title === "Collections" && item.subItems.length === 1 && (
              <CreateCollectionDialog onCollectionCreated={onCollectionCreated}>
                <SidebarMenuSubButton className="text-muted-foreground hover:text-foreground w-full cursor-pointer justify-start">
                  <FolderPlus className="h-4 w-4 transition-transform hover:scale-110" />
                  <span>Create your first collection</span>
                </SidebarMenuSubButton>
              </CreateCollectionDialog>
            )}
          </HoverCardContent>
        </HoverCard>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem key={item.title}>
      <CustomTooltip content={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.url)}
          tooltip={item.title}
          className="flex flex-col items-center gap-1 p-2"
          aria-label={item.displayLabel ?? item.title}
        >
          <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
            <IconWithLabel item={item} isBrandItem={isBrandItem} />
          </Link>
        </SidebarMenuButton>
      </CustomTooltip>
    </SidebarMenuItem>
  );
};

export function NavMain({ items, onCollectionCreated }: NavMainProps) {
  const path = usePathname();

  const isItemActive = (url: string, subItems?: NavMainItem["subItems"]) => {
    if (subItems?.length) {
      return subItems.some((sub) => path.startsWith(sub.url));
    }
    return path === url;
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Write Script"
                className="text-secondary-foreground hover:text-secondary-foreground active:text-secondary-foreground flex h-8 min-w-8 items-center justify-center shadow-md transition-[width,height,padding,box-shadow] duration-200 ease-linear group-data-[collapsible=icon]:size-[40px] group-data-[collapsible=icon]:p-0"
                style={
                  {
                    "--tw-bg-opacity": 1,
                    backgroundColor: "oklch(var(--background-color-300)/var(--tw-bg-opacity))",
                    "--hover-bg": "oklch(var(--background-color-300)/0.8)",
                    "--active-bg": "oklch(var(--background-color-300)/0.8)",
                  } as React.CSSProperties
                }
              >
                <Link href="/dashboard/scripts/new">
                  <Zap className="transition-transform group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4 hover:scale-110" />
                  <span className="group-data-[collapsible=icon]:sr-only">Write Script</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={isItemActive}
                  onCollectionCreated={onCollectionCreated}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
