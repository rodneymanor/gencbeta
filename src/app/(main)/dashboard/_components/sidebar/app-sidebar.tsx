"use client";

import { useEffect, useState, useRef } from "react";

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

import { ExpandableSidebarPanel, defaultSidebarSections, SidebarItemWithSubs } from "./expandable-sidebar-panel";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarPinControl } from "./sidebar-pin-control";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useAuth();
  const { sidebarItems: dynamicSidebarItems, refreshCollections } = useCollectionsSidebar(sidebarItems);

  // Use smart sidebar for expandable panel management only
  const smartSidebar = useSmartSidebarContext();
  // State for tracking hovered sidebar item
  const [hoveredItem, setHoveredItem] = useState<SidebarItemWithSubs | null>(null);
  const [isHoveringSpecificItem, setIsHoveringSpecificItem] = useState(false);
  const isHoveringSidebarArea = useRef(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Keep the main sidebar collapsed - don't sync with smart sidebar state
  // The main sidebar should stay in icon-only mode

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
    };
  }, []);

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

  const clearHoverTimeout = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  const handleSidebarMouseEnter = () => {
    // Clear any pending timeout
    clearHoverTimeout();
    // Expand the panel when sidebar is hovered
    smartSidebar.setExpanded(true);
    isHoveringSidebarArea.current = true;
  };

  const handleSidebarMouseLeave = () => {
    // Don't immediately collapse - wait to see if user moves to expandable panel
    isHoveringSidebarArea.current = false;
    clearHoverTimeout();
    hoverTimeout.current = setTimeout(() => {
      if (!isHoveringSidebarArea.current && !smartSidebar.isPinned) {
        smartSidebar.setExpanded(false);
        setHoveredItem(null);
        setIsHoveringSpecificItem(false);
      }
    }, 150);
  };

  const handleExpandablePanelMouseEnter = () => {
    // Clear any pending timeout
    clearHoverTimeout();
    // Keep the panel expanded when hovering over it
    smartSidebar.setExpanded(true);
    isHoveringSidebarArea.current = true;
  };

  const handleExpandablePanelMouseLeave = () => {
    // Don't immediately collapse - wait to see if user moves back to main sidebar
    isHoveringSidebarArea.current = false;
    clearHoverTimeout();
    hoverTimeout.current = setTimeout(() => {
      if (!isHoveringSidebarArea.current && !smartSidebar.isPinned) {
        smartSidebar.setExpanded(false);
        setHoveredItem(null);
        setIsHoveringSpecificItem(false);
      }
    }, 150);
  };

  const handleItemMouseEnter = (item: SidebarItemWithSubs) => {
    // For Home icon, don't show its subItems, just show the default sidebar sections
    if (item.title === "Home") {
      setHoveredItem(null);
      setIsHoveringSpecificItem(false);
    } else {
      setHoveredItem(item);
      setIsHoveringSpecificItem(true);
    }
    smartSidebar.setExpanded(true);
  };

  const handleItemMouseLeave = () => {
    // Don't immediately hide sub-items - give user time to reach expandable panel
    clearHoverTimeout();
    hoverTimeout.current = setTimeout(() => {
      if (!isHoveringSidebarArea.current && !smartSidebar.isPinned) {
        setIsHoveringSpecificItem(false);
        setHoveredItem(null);
      }
    }, 150);
  };

  return (
    <>
      {/* Hover target that only covers the collapsed sidebar area */}
      <div
        className="fixed inset-y-0 left-0 z-[95] w-[70px]"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      />
      <Sidebar {...props} className="relative z-[100] transition-all duration-200">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="hover:bg-transparent active:bg-transparent">
                <a href="#" className="flex w-full items-center gap-2">
                  <GenCLogo iconSize="sm" textSize="sm" />
                  <SidebarPinControl />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain
            items={filteredSidebarItems}
            onCollectionCreated={refreshCollections}
            onItemMouseEnter={handleItemMouseEnter}
            onItemMouseLeave={handleItemMouseLeave}
          />
        </SidebarContent>
        <SidebarFooter>
          <div className="space-y-2">
            <UsageTracker />
            <NavUser />
          </div>
        </SidebarFooter>
      </Sidebar>
      <ExpandableSidebarPanel
        isExpanded={smartSidebar.isExpanded}
        isPinned={smartSidebar.isPinned}
        onTogglePin={smartSidebar.togglePin}
        sections={defaultSidebarSections}
        hoveredItem={hoveredItem}
        isHoveringSpecificItem={isHoveringSpecificItem}
        onPersonalize={() => {
          // Handle personalization logic
          console.log("Personalize clicked");
        }}
        onMouseEnter={handleExpandablePanelMouseEnter}
        onMouseLeave={handleExpandablePanelMouseLeave}
      />
    </>
  );
}
