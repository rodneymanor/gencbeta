"use client";

import { GenCLogo } from "@/components/ui/gen-c-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useCollectionsSidebar } from "@/hooks/use-collections-sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useAuth();
  const { sidebarItems: dynamicSidebarItems, refreshCollections } = useCollectionsSidebar(sidebarItems);

  // Filter sidebar items based on user role
  const filteredSidebarItems = dynamicSidebarItems.filter((group) => {
    // Show administration section only to super admins
    if (group.label === "Administration") {
      return userProfile?.role === "super_admin";
    }

    // Show collections section only to coaches and super admins
    if (group.label === "Collections") {
      return userProfile?.role === "coach" || userProfile?.role === "super_admin";
    }

    // Show all other sections to everyone
    return true;
  });

  return (
    <Sidebar {...props}>
      <SidebarHeader>
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
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
