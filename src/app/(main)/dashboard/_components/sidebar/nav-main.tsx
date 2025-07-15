"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight, FolderPlus, Plus, FileText, Pen, FolderOpen, Video } from "lucide-react";

import { CreateCollectionDialog } from "@/app/(main)/research/collections/_components/create-collection-dialog";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const active = isActive(item.url, item.subItems);

  return (
    <SidebarMenuItem className={className}>
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>
          <div className="gap-.5 flex flex-col items-center">
            {/* Icon container with background */}
            {hasSubItems ? (
              <div className="group cursor-pointer">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 ${
                    active 
                      ? 'bg-border hover:bg-border/80' 
                      : 'hover:bg-border/50'
                  }`}
                >
                  {item.icon && <item.icon className="h-5 w-5 text-muted-foreground" />}
                </div>
              </div>
            ) : (
              <Link href={item.url} className="group">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 ${
                    active 
                      ? 'bg-border hover:bg-border/80' 
                      : 'hover:bg-border/50'
                  }`}
                >
                  {item.icon && <item.icon className="h-5 w-5 text-muted-foreground" />}
                </div>
              </Link>
            )}

            {/* Label outside the background container */}
            <span className="text-muted-foreground text-center text-xs font-medium whitespace-nowrap">
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
              <HoverCard openDelay={150}>
                <HoverCardTrigger asChild>
                  <div className="gap-.5 flex flex-col items-center">
                    {/* New Plus Button with Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="group cursor-pointer">
                          <div
                            className="bg-border hover:bg-border/80 flex h-8 w-8 items-center justify-center rounded-lg px-2 py-2 transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="h-5 w-5 text-muted-foreground transition-transform" />
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
                </HoverCardTrigger>
                <HoverCardContent side="right" className="w-32 p-2">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Create</span>
                  </div>
                </HoverCardContent>
              </HoverCard>
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
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
