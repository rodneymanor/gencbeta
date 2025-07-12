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
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean;
}) => {
  return (
    <SidebarMenuItem>
      <div className="flex flex-col items-center gap-1">
        {/* Icon container with background */}
        <Link href={item.url} className="group">
          <div className="bg-background-color-300 flex h-8 w-8 items-center justify-center rounded-md px-2 py-2 transition-all duration-200 hover:bg-[oklch(var(--background-color-300)/0.8)]">
            {item.icon && <item.icon className="h-5 w-5" />}
          </div>
        </Link>

        {/* Label outside the background container */}
        <span className="text-secondary-foreground text-center text-xs font-medium whitespace-nowrap">
          {item.title}
        </span>
      </div>
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
                className="text-secondary-foreground hover:text-secondary-foreground active:text-secondary-foreground flex h-auto flex-col items-center justify-center gap-2 !overflow-visible overflow-visible px-2 py-3 shadow-md transition-[width,height,padding,box-shadow] duration-200 ease-linear"
                style={
                  {
                    "--tw-bg-opacity": 1,
                    backgroundColor: "oklch(var(--background-color-300)/var(--tw-bg-opacity))",
                    "--hover-bg": "oklch(var(--background-color-300)/0.8)",
                    "--active-bg": "oklch(var(--background-color-300)/0.8)",
                  } as React.CSSProperties
                }
              >
                <Link href="/dashboard/scripts/new" className="flex w-full flex-col items-center justify-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <Zap className="h-5 w-5 transition-transform hover:scale-110" />
                  </div>
                  <span className="!text-overflow-clip !overflow-visible overflow-visible text-center text-xs font-medium whitespace-nowrap">
                    Write Script
                  </span>
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
                <NavItem key={item.title} item={item} isActive={isItemActive} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
