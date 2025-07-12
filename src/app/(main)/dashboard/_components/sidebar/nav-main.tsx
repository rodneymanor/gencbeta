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
    <SidebarMenuItem>
      {item.subItems ? (
        <HoverCard openDelay={150}>
          <HoverCardTrigger asChild>
            <SidebarMenuButton
              asChild
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-auto flex-col items-center justify-center gap-2 px-2 py-3"
              data-active={isActive(item.url, item.subItems)}
            >
              <div className="flex w-full flex-col items-center justify-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center">
                  {item.icon && <item.icon className="h-5 w-5 transition-transform hover:scale-110" />}
                </div>
                <span className="line-clamp-1 w-full text-center text-xs font-medium group-data-[collapsible=icon]:sr-only">
                  {item.title}
                </span>
                {isBrandItem && <BrandProfileIndicator />}
              </div>
            </SidebarMenuButton>
          </HoverCardTrigger>
          {/* ... rest of hover card content */}
        </HoverCard>
      ) : (
        <SidebarMenuButton
          asChild
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-auto flex-col items-center justify-center gap-2 px-2 py-3"
          data-active={isActive(item.url)}
        >
          <Link
            href={item.url}
            target={item.newTab ? "_blank" : undefined}
            className="flex w-full flex-col items-center justify-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center">
              {item.icon && <item.icon className="h-5 w-5 transition-transform hover:scale-110" />}
            </div>
            <span className="line-clamp-1 w-full text-center text-xs font-medium group-data-[collapsible=icon]:sr-only">
              {item.title}
            </span>
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
