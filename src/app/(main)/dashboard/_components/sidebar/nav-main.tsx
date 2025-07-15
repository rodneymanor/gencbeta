"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight, FolderPlus, Plus, FileText, Pen, FolderOpen, Video } from "lucide-react";

import { CreateCollectionDialog } from "@/app/(main)/research/collections/_components/create-collection-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      icon: navItem.icon ? <navItem.icon className="h-4 w-4" /> : undefined,
      subItems:
        navItem.subItems?.map((subItem) => ({
          id: subItem.title.toLowerCase().replace(/ /g, "-"),
          title: subItem.title,
          href: subItem.url,
          icon: subItem.icon ? <subItem.icon className="h-4 w-4" /> : undefined,
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
        {/* Icon container with background */}
        {hasSubItems ? (
          <div className="group cursor-pointer" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 ${
                active ? "bg-border hover:bg-border/80" : "hover:bg-border/50"
              }`}
            >
              {item.icon && <item.icon className="text-muted-foreground h-5 w-5" />}
            </div>
          </div>
        ) : (
          <Link href={item.url} className="group">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 ${
                active ? "bg-border hover:bg-border/80" : "hover:bg-border/50"
              }`}
            >
              {item.icon && <item.icon className="text-muted-foreground h-5 w-5" />}
            </div>
          </Link>
        )}

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
    if (subItems?.length) {
      return subItems.some((sub) => path.startsWith(sub.url));
    }
    return path === url;
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
                "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
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
                {/* New Plus Button with Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="group cursor-pointer">
                      <div className="bg-border hover:bg-border/80 flex h-8 w-8 items-center justify-center rounded-lg px-2 py-2 transition-all duration-200 hover:scale-105">
                        <Plus className="text-muted-foreground h-5 w-5 transition-transform" />
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/scripts/new" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>New Script</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/capture/notes" className="flex items-center gap-2">
                        <Pen className="h-4 w-4" />
                        <span>New Note</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/research/collections" className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>New Collection</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/research/collections" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Add Video to Collection</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
