"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight, FolderPlus } from "lucide-react";

import { CreateCollectionDialog } from "@/app/(main)/research/collections/_components/create-collection-dialog";
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

  return (
    <SidebarMenuItem key={item.title}>
      {item.subItems ? (
        <HoverCard openDelay={150} closeDelay={300}>
          <HoverCardTrigger asChild>
            <SidebarMenuButton
              disabled={item.comingSoon}
              tooltip={item.title}
              isActive={isActive(item.url, item.subItems)}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {isBrandItem && <BrandProfileIndicator />}
              <ChevronRight className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </HoverCardTrigger>
          <HoverCardContent className="w-60 space-y-1 p-2" side="right" align="start" sideOffset={8}>
            {item.subItems.map((subItem) => (
              <SidebarMenuSubButton
                key={subItem.title}
                asChild
                className="w-full justify-start"
                aria-disabled={subItem.comingSoon}
                isActive={isActive(subItem.url)}
              >
                <Link href={subItem.url} target={subItem.newTab ? "_blank" : undefined}>
                  {subItem.icon && <subItem.icon className="h-4 w-4" />}
                  <span>{subItem.title}</span>
                  {subItem.comingSoon && <IsComingSoon />}
                </Link>
              </SidebarMenuSubButton>
            ))}
            {item.title === "Collections" && item.subItems.length === 1 && (
              <CreateCollectionDialog onCollectionCreated={onCollectionCreated}>
                <SidebarMenuSubButton className="text-muted-foreground hover:text-foreground w-full cursor-pointer justify-start">
                  <FolderPlus className="h-4 w-4" />
                  <span>Create your first collection</span>
                </SidebarMenuSubButton>
              </CreateCollectionDialog>
            )}
          </HoverCardContent>
        </HoverCard>
      ) : (
        <SidebarMenuButton asChild aria-disabled={item.comingSoon} isActive={isActive(item.url)} tooltip={item.title}>
          <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {isBrandItem && <BrandProfileIndicator />}
            {item.comingSoon && <IsComingSoon />}
          </Link>
        </SidebarMenuButton>
      )}
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
                className="text-secondary-foreground hover:text-secondary-foreground active:text-secondary-foreground flex h-8 min-w-8 items-center justify-center shadow-md transition-[width,height,padding,box-shadow] duration-200 ease-linear group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0"
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
                  <Zap className="group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
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
