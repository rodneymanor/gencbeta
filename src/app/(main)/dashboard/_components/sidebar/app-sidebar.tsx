"use client";

import { useEffect } from "react";

import { useSmartSidebarContext } from "@/components/providers/smart-sidebar-provider";
import { GenCLogo } from "@/components/ui/gen-c-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UsageTracker } from "@/components/ui/usage-tracker";
import { useAuth } from "@/contexts/auth-context";
import { useCollectionsSidebar } from "@/hooks/use-collections-sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarHoverWrapper } from "./sidebar-hover-wrapper";
import { SidebarPinControl } from "./sidebar-pin-control";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useAuth();
  const { sidebarItems: dynamicSidebarItems, refreshCollections } = useCollectionsSidebar(sidebarItems);
  const { setOpen } = useSidebar();

  // Use smart sidebar for proper manual/hover state management
  const smartSidebar = useSmartSidebarContext();

  // Sync smart sidebar state with the main sidebar context
  useEffect(() => {
    setOpen(smartSidebar.isOpen);
  }, [smartSidebar.isOpen, setOpen]);

  // Filter sidebar items based on user role
  const filteredSidebarItems = dynamicSidebarItems
    .filter((group) => {
      // Show team section only to coaches and super admins
      if (group.label === "Team") {
        return userProfile?.role === "coach" || userProfile?.role === "super_admin";
      }

      // Show all other sections to everyone
      return true;
    })
    .map((group) => {
      // Filter team items based on specific roles
      if (group.label === "Team") {
        return {
          ...group,
          items: group.items.filter((item) => {
            // Show admin panel only to super admins
            if (item.title === "Admin") {
              return userProfile?.role === "super_admin";
            }
            // Show creators to coaches and super admins
            return userProfile?.role === "coach" || userProfile?.role === "super_admin";
          }),
        };
      }
      return group;
    });

  return (
    <SidebarHoverWrapper>
      <Sidebar
        {...props}
        className={`transition-all duration-200 ${smartSidebar.visualState === "hover-open" ? "hover:shadow-lg" : ""}`}
      >
        <SidebarHeader>
          <SidebarPinControl />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                <a href="#">
                  <GenCLogo iconSize="sm" textSize="sm" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={filteredSidebarItems} onCollectionCreated={refreshCollections} />
          {/* <NavDocuments items={data.documents} /> */}
          {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        </SidebarContent>
        <SidebarFooter>
          <div className="space-y-2">
            <UsageTracker />
            <NavUser />
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarHoverWrapper>
  );
}
