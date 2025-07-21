"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight, FolderPlus, Plus } from "lucide-react";

import { CreateCollectionDialog } from "@/app/(main)/research/collections/_components/create-collection-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";

import { BrandProfileIndicator } from "./brand-profile-indicator";
import { SidebarItemWithSubs } from "./expandable-sidebar-panel";

interface NavMainProps {
  readonly items: readonly NavGroup[];
  readonly onCollectionCreated?: () => void;
  readonly iconOnly?: boolean;
  readonly onItemMouseEnter?: (item: SidebarItemWithSubs) => void;
  readonly onItemMouseLeave?: () => void;
}

const IsComingSoon = () => (
  <span className="ml-auto rounded-md bg-gray-200 px-2 py-1 text-xs dark:text-gray-800">Soon</span>
);

const NavItem = ({
  item,
  isActive,
  className,
  onItemMouseEnter,
  onItemMouseLeave,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean;
  className?: string;
  onItemMouseEnter?: (item: SidebarItemWithSubs) => void;
  onItemMouseLeave?: () => void;
}) => {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const active = isActive(item.url, item.subItems);

  // Convert NavMainItem to SidebarItemWithSubs format
  const convertToSidebarItem = (navItem: NavMainItem): SidebarItemWithSubs => {
    return {
      id: navItem.title.toLowerCase().replace(/ /g, "-"),
      title: navItem.title,
      href: navItem.url,
      icon: navItem.icon ? <navItem.icon className="h-6 w-6" /> : undefined,
      subItems:
        navItem.subItems?.map((subItem) => ({
          id: subItem.title.toLowerCase().replace(/ /g, "-"),
          title: subItem.title,
          href: subItem.url,
          icon: subItem.icon ? <subItem.icon className="h-6 w-6" /> : undefined,
        })) || undefined,
    };
  };

  const handleMouseEnter = () => {
    if (hasSubItems && onItemMouseEnter) {
      onItemMouseEnter(convertToSidebarItem(item));
    }
  };

  const handleMouseLeave = () => {
    if (onItemMouseLeave) {
      onItemMouseLeave();
    }
  };

  return (
    <SidebarMenuItem className={className}>
      <div className="gap-.5 flex flex-col items-center">
        {/* Icon container with background - Always clickable, but also hoverable if has subItems */}
        <div className="group cursor-pointer" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Link href={item.url}>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 ${
                active ? "bg-[#e6e8e1] hover:bg-[#e6e8e1]/80" : "hover:bg-[#e6e8e1]/50"
              }`}
            >
              {item.icon && <item.icon className="text-muted-foreground h-6 w-6" />}
            </div>
          </Link>
        </div>

        {/* Label outside the background container */}
        <span className="text-muted-foreground text-center text-xs font-medium whitespace-nowrap">{item.title}</span>
      </div>
    </SidebarMenuItem>
  );
};

export function NavMain({
  items,
  onCollectionCreated,
  iconOnly = false,
  onItemMouseEnter,
  onItemMouseLeave,
}: NavMainProps) {
  const path = usePathname();

  const isItemActive = (url: string, subItems?: NavMainItem["subItems"]) => {
    // Determine which item should be active based on path prioritization
    const allItems = items.flatMap((group) => group.items);

    // Find the item with the most specific match for the current path
    const activeItem = allItems.find((item) => {
      // Exact match with main URL has highest priority
      if (path === item.url) {
        return true;
      }

      // Check if path starts with item URL (for nested paths)
      if (path.startsWith(item.url + "/")) {
        return true;
      }

      return false;
    });

    // If we found an active item based on main URL, use that
    if (activeItem) {
      return activeItem.url === url;
    }

    // Otherwise, check subItems but only for the item with the best match
    const itemsWithSubMatches = allItems.filter((item) => item.subItems?.some((sub) => path === sub.url));

    if (itemsWithSubMatches.length > 0) {
      // Prioritize items based on URL specificity
      const bestMatch = itemsWithSubMatches.reduce((best, current) => {
        // Prefer items with more specific (longer) main URLs
        if (current.url.length > best.url.length) {
          return current;
        }
        return best;
      });

      return bestMatch.url === url;
    }

    return false;
  };

  // Icon-only mode for the static sidebar
  if (iconOnly) {
    return (
      <>
        {items.map((group) =>
          group.items.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isItemActive(item.url, item.subItems) ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {item.icon && <item.icon className="h-6 w-6" />}
            </Link>
          )),
        )}
      </>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="mt-8">
              <div className="gap-.5 flex flex-col items-center">
                {/* Plus Button - Direct Link to Scripts New */}
                <Link href="/dashboard/scripts/new">
                  <div className="group cursor-pointer">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e6e8e1] px-2 py-2 transition-all duration-200 hover:scale-105 hover:bg-[#e6e8e1]/80">
                      <Plus className="text-muted-foreground h-6 w-6 transition-transform" />
                    </div>
                  </div>
                </Link>

                {/* Label outside the background container */}
                {/* <span className="text-secondary-foreground text-center text-xs font-medium whitespace-nowrap">
                  Create
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
              {group.items.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={isItemActive}
                  className={group.id === 1 ? "mt-8" : ""}
                  onItemMouseEnter={onItemMouseEnter}
                  onItemMouseLeave={onItemMouseLeave}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
