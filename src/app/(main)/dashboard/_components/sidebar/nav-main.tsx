"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Zap, ChevronRight, FolderPlus } from "lucide-react";

import { CreateCollectionDialog } from "@/app/(main)/research/collections/_components/create-collection-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";

interface NavMainProps {
  readonly items: readonly NavGroup[];
  readonly onCollectionCreated?: () => void;
}

const IsComingSoon = () => (
  <span className="ml-auto rounded-md bg-gray-200 px-2 py-1 text-xs dark:text-gray-800">Soon</span>
);

const NavItemExpanded = ({
  item,
  isActive,
  isSubmenuOpen,
  onCollectionCreated,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean;
  isSubmenuOpen: (subItems?: NavMainItem["subItems"]) => boolean;
  onCollectionCreated?: () => void;
}) => {
  return (
    <Collapsible key={item.title} asChild defaultOpen={isSubmenuOpen(item.subItems)} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {item.subItems ? (
            <SidebarMenuButton
              disabled={item.comingSoon}
              isActive={isActive(item.url, item.subItems)}
              tooltip={item.title}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {item.comingSoon && <IsComingSoon />}
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              asChild
              aria-disabled={item.comingSoon}
              isActive={isActive(item.url)}
              tooltip={item.title}
            >
              <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.comingSoon && <IsComingSoon />}
              </Link>
            </SidebarMenuButton>
          )}
        </CollapsibleTrigger>
        {item.subItems && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton aria-disabled={subItem.comingSoon} isActive={isActive(subItem.url)} asChild>
                    <Link href={subItem.url} target={subItem.newTab ? "_blank" : undefined}>
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                      {subItem.comingSoon && <IsComingSoon />}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
              {item.title === "Collections" && item.subItems.length === 1 && (
                <SidebarMenuSubItem>
                  <CreateCollectionDialog onCollectionCreated={onCollectionCreated}>
                    <SidebarMenuSubButton className="text-muted-foreground hover:text-foreground cursor-pointer">
                      <FolderPlus />
                      <span>Create your first collection</span>
                    </SidebarMenuSubButton>
                  </CreateCollectionDialog>
                </SidebarMenuSubItem>
              )}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
};

const NavItemCollapsed = ({
  item,
  isActive,
  onCollectionCreated,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean;
  onCollectionCreated?: () => void;
}) => {
  return (
    <SidebarMenuItem key={item.title}>
      {item.subItems ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              disabled={item.comingSoon}
              tooltip={item.title}
              isActive={isActive(item.url, item.subItems)}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-50 space-y-1" side="right" align="start">
            {item.subItems.map((subItem) => (
              <DropdownMenuItem key={subItem.title} asChild>
                <SidebarMenuSubButton
                  key={subItem.title}
                  asChild
                  className="focus-visible:ring-0"
                  aria-disabled={subItem.comingSoon}
                  isActive={isActive(subItem.url)}
                >
                  <Link href={subItem.url} target={subItem.newTab ? "_blank" : undefined}>
                    {subItem.icon && <subItem.icon className="[&>svg]:text-sidebar-foreground" />}
                    <span>{subItem.title}</span>
                    {subItem.comingSoon && <IsComingSoon />}
                  </Link>
                </SidebarMenuSubButton>
              </DropdownMenuItem>
            ))}
            {item.title === "Collections" && item.subItems.length === 1 && (
              <DropdownMenuItem asChild>
                <CreateCollectionDialog onCollectionCreated={onCollectionCreated}>
                  <SidebarMenuSubButton className="text-muted-foreground hover:text-foreground cursor-pointer focus-visible:ring-0">
                    <FolderPlus />
                    <span>Create your first collection</span>
                  </SidebarMenuSubButton>
                </CreateCollectionDialog>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <SidebarMenuButton asChild aria-disabled={item.comingSoon} isActive={isActive(item.url)} tooltip={item.title}>
          <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.comingSoon && <IsComingSoon />}
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

export function NavMain({ items, onCollectionCreated }: NavMainProps) {
  const path = usePathname();
  const { state, isMobile } = useSidebar();

  const isItemActive = (url: string, subItems?: NavMainItem["subItems"]) => {
    if (subItems?.length) {
      return subItems.some((sub) => path.startsWith(sub.url));
    }
    return path === url;
  };

  const isSubmenuOpen = (subItems?: NavMainItem["subItems"]) => {
    // Always expand sub items by default
    return subItems && subItems.length > 0;
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Speed Write"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground active:bg-secondary/80 active:text-secondary-foreground flex h-8 min-w-8 items-center justify-center shadow-md transition-[width,height,padding,box-shadow] duration-200 ease-linear group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0"
              >
                <Link href="/dashboard/scripts/new">
                  <Zap className="group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
                  <span className="group-data-[collapsible=icon]:sr-only">Speed Write</span>
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
              {group.items.map((item) =>
                state === "collapsed" && !isMobile ? (
                  <NavItemCollapsed
                    key={item.title}
                    item={item}
                    isActive={isItemActive}
                    onCollectionCreated={onCollectionCreated}
                  />
                ) : (
                  <NavItemExpanded
                    key={item.title}
                    item={item}
                    isActive={isItemActive}
                    isSubmenuOpen={isSubmenuOpen}
                    onCollectionCreated={onCollectionCreated}
                  />
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
