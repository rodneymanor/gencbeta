"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

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

import { useDynamicSidebarSections } from "./dynamic-sidebar-sections";
import { ExpandableSidebarPanel, defaultSidebarSections, SidebarItemWithSubs } from "./expandable-sidebar-panel";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarPinControl } from "./sidebar-pin-control";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useAuth();
  const { sidebarItems: dynamicSidebarItems, refreshCollections } = useCollectionsSidebar(sidebarItems);
  const dynamicSections = useDynamicSidebarSections();

  // Use smart sidebar for expandable panel management only
  const smartSidebar = useSmartSidebarContext();
  // State for tracking hovered sidebar item
  const [hoveredItem, setHoveredItem] = useState<SidebarItemWithSubs | null>(null);
  const [isHoveringSpecificItem, setIsHoveringSpecificItem] = useState(false);
  const isHoveringSidebarArea = useRef(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // CRITICAL FIX: Add click state management
  const [isClicking, setIsClicking] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Click state handlers
  const handleMouseDown = useCallback(() => {
    setIsClicking(true);
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    // Keep clicking state for a short time to prevent premature closure
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setIsClicking(false);
    }, 150); // Give enough time for navigation to complete
  }, []);

  // Keep the main sidebar collapsed - don't sync with smart sidebar state
  // The main sidebar should stay in icon-only mode

  // Enhanced cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
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

  // FIXED: Click outside handler with better detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (smartSidebar.isPinned || isClicking) return;
      
      const target = event.target as HTMLElement;
      const isClickingOnSidebar = target.closest('[data-sidebar="sidebar"]');
      const isClickingOnExpandablePanel = target.closest(".expandable-sidebar-panel");
      const isClickingOnSubmenuItem = target.closest("[data-submenu-item]");

      if (!isClickingOnSidebar && !isClickingOnExpandablePanel && !isClickingOnSubmenuItem) {
        smartSidebar.setExpanded(false);
        setHoveredItem(null);
        setIsHoveringSpecificItem(false);
        isHoveringSidebarArea.current = false;
        clearHoverTimeout();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [smartSidebar, isClicking]);

  const handleSidebarMouseEnter = () => {
    // Clear any pending timeout
    clearHoverTimeout();
    // Expand the panel when sidebar is hovered
    smartSidebar.setExpanded(true);
    isHoveringSidebarArea.current = true;
  };

  const handleSidebarMouseLeave = () => {
    // Set flag but don't immediately collapse - let other hover events take precedence
    isHoveringSidebarArea.current = false;
    clearHoverTimeout();

    // Only collapse if user moves completely away from sidebar area
    hoverTimeout.current = setTimeout(() => {
      if (!isHoveringSidebarArea.current && !smartSidebar.isPinned) {
        smartSidebar.setExpanded(false);
        setHoveredItem(null);
        setIsHoveringSpecificItem(false);
      }
    }, 500); // Increased timeout for better UX
  };

  const handleExpandablePanelMouseEnter = () => {
    // Clear any pending timeout
    clearHoverTimeout();
    // Keep the panel expanded when hovering over it
    smartSidebar.setExpanded(true);
    isHoveringSidebarArea.current = true;
  };

  const handleExpandablePanelMouseLeave = () => {
    // Only collapse if user leaves the entire sidebar area, not just this panel
    isHoveringSidebarArea.current = false;
    clearHoverTimeout();
    
    // CRITICAL FIX: Respect clicking state and increase timeout
    hoverTimeout.current = setTimeout(() => {
      if (!isHoveringSidebarArea.current && !smartSidebar.isPinned && !isClicking) {
        smartSidebar.setExpanded(false);
        setHoveredItem(null);
        setIsHoveringSpecificItem(false);
      }
    }, 1000); // Increased timeout for better sub-menu interaction
  };

  const handleItemMouseEnter = (item: SidebarItemWithSubs) => {
    // Clear any pending timeouts
    clearHoverTimeout();

    // Always expand the sidebar when hovering an item
    smartSidebar.setExpanded(true);
    isHoveringSidebarArea.current = true;

    // Set the specific item state
    if (item.title === "Home") {
      // For Home icon, show default sidebar sections
      setHoveredItem(null);
      setIsHoveringSpecificItem(false);
    } else {
      // For other items, show their specific content
      setHoveredItem(item);
      setIsHoveringSpecificItem(true);
    }
  };

  const handleItemMouseLeave = () => {
    // Don't immediately change state - let the expanded panel persist
    // The item state will only change when:
    // 1. Another item is hovered
    // 2. User leaves the entire sidebar area
    // 3. Sidebar is explicitly closed
    // This eliminates dead spots and provides smoother transitions
  };

  return (
    <>
      {/* Extended hover detection area to eliminate dead spots */}
      <div
        className="fixed inset-y-0 left-0 z-[1] w-[300px]"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        style={{ pointerEvents: "none" }}
      />
      <Sidebar {...props} className="relative transition-all duration-200">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="hover:bg-transparent active:bg-transparent">
                <Link href="/dashboard/scripts/new" className="flex w-full items-center gap-2">
                  <GenCLogo iconSize="sm" textSize="sm" />
                  <SidebarPinControl />
                </Link>
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
        sections={dynamicSections}
        hoveredItem={hoveredItem}
        isHoveringSpecificItem={isHoveringSpecificItem}
        onPersonalize={() => {
          // Handle personalization logic
          console.log("Personalize clicked");
        }}
        onMouseEnter={handleExpandablePanelMouseEnter}
        onMouseLeave={handleExpandablePanelMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}
