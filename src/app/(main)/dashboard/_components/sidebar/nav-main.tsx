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
  className,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean;
  className?: string;
}) => {
  const hasSubItems = item.subItems && item.subItems.length > 0;

  return (
    <SidebarMenuItem className={className}>
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>
          <div className="gap-.5 flex flex-col items-center">
            {/* Icon container with background */}
            {hasSubItems ? (
              <div className="group cursor-pointer">
                <div className="bg-background-color-300 flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 hover:bg-[oklch(var(--background-color-300)/0.8)]">
                  {item.icon && <item.icon className="h-5 w-5" />}
                </div>
              </div>
            ) : (
              <Link href={item.url} className="group">
                <div className="bg-background-color-300 flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 hover:bg-[oklch(var(--background-color-300)/0.8)]">
                  {item.icon && <item.icon className="h-5 w-5" />}
                </div>
              </Link>
            )}

            {/* Label outside the background container */}
            <span className="text-secondary-foreground text-center text-xs font-medium whitespace-nowrap">
              {item.title}
            </span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-48 p-2">
          <div className="flex flex-col gap-1">
            {hasSubItems ? (
              // Show subitems for items that have them
              item.subItems?.map((subItem) => (
                <Link
                  key={subItem.title}
                  href={subItem.url}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                >
                  {subItem.icon && <subItem.icon className="h-4 w-4" />}
                  <span>{subItem.title}</span>
                </Link>
              ))
            ) : (
              // Show single item for items without subitems
              <Link
                href={item.url}
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
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
            <SidebarMenuItem className="mt-8">
              <div className="gap-.5 flex flex-col items-center">
                {/* Icon container with background */}
                <Link href="/dashboard/scripts/new" className="group">
                  <div
                    className="bg-background-color-300 flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 hover:bg-[oklch(var(--background-color-300)/0.8)]"
                    style={{
                      backgroundColor: "oklch(var(--background-color-300)/0.8)",
                    }}
                  >
                    <Zap className="h-5 w-5 transition-transform hover:scale-110" />
                  </div>
                </Link>

                {/* Label outside the background container */}
                {/* <span className="text-secondary-foreground text-center text-xs font-medium whitespace-nowrap">
                  Write Script
                </span> */}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {group.items.map((item, index) => (
                <NavItem key={item.title} item={item} isActive={isItemActive} className={index === 0 ? "mt-8" : ""} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
