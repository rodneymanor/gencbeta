"use client";

import { GenCLogo } from "@/components/ui/gen-c-logo";
import { UsageTracker } from "@/components/ui/usage-tracker";
import { useAuth } from "@/contexts/auth-context";
import { useCollectionsSidebar } from "@/hooks/use-collections-sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { MinimalNav } from "./minimal-nav";
import { MinimalNavUser } from "./minimal-nav-user";

export function AppSidebar() {
  const { userProfile } = useAuth();
  const { sidebarItems: dynamicSidebarItems, refreshCollections } = useCollectionsSidebar(sidebarItems);

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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-2 p-4 border-b">
        <div className="flex items-center gap-2">
          <GenCLogo iconSize="sm" textSize="sm" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <MinimalNav items={filteredSidebarItems} onCollectionCreated={refreshCollections} />
      </div>
      
      {/* Footer */}
      <div className="border-t p-4 space-y-2">
        <UsageTracker />
        <MinimalNavUser />
      </div>
    </div>
  );
}
