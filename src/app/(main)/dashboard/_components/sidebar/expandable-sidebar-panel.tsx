"use client";

import { usePathname } from "next/navigation";

import { Pin, Settings, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationItem {
  id: string;
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

interface SidebarSubItem {
  id: string;
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarItemWithSubs {
  id: string;
  title: string;
  href: string;
  icon?: React.ReactNode;
  subItems?: SidebarSubItem[];
}

interface ExpandableSidebarPanelProps {
  isExpanded: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  onPersonalize?: () => void;
  sections: NavigationSection[];
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  currentPage?: string;
  hoveredItem?: SidebarItemWithSubs | null;
  isHoveringSpecificItem?: boolean;
}

const sampleIcons = {
  spaces: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.045 9.777a6 6 0 1 0 5.951 .023"></path>
      <path d="M11.997 20.196a6 6 0 1 0 -2.948 -5.97"></path>
      <path d="M17.95 9.785q .05 -.386 .05 -.785a6 6 0 1 0 -3.056 5.23"></path>
    </svg>
  ),
  star: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"></path>
    </svg>
  ),
  cpu: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 5m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z"></path>
      <path d="M9 9h6v6h-6z"></path>
      <path d="M3 10h2"></path>
      <path d="M3 14h2"></path>
      <path d="M10 3v2"></path>
      <path d="M14 3v2"></path>
      <path d="M21 10h-2"></path>
      <path d="M21 14h-2"></path>
      <path d="M14 21v-2"></path>
      <path d="M10 21v-2"></path>
    </svg>
  ),
  dollar: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2"></path>
      <path d="M12 3v3m0 12v3"></path>
    </svg>
  ),
  palette: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25"></path>
      <path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
      <path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
      <path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
    </svg>
  ),
  football: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 9l-6 6"></path>
      <path d="M10 12l2 2"></path>
      <path d="M12 10l2 2"></path>
      <path d="M8 21a5 5 0 0 0 -5 -5"></path>
      <path d="M16 3c-7.18 0 -13 5.82 -13 13a5 5 0 0 0 5 5c7.18 0 13 -5.82 13 -13a5 5 0 0 0 -5 -5"></path>
      <path d="M16 3a5 5 0 0 0 5 5"></path>
    </svg>
  ),
  tv: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"></path>
      <path d="M16 3l-4 4l-4 -4"></path>
    </svg>
  ),
};

export function ExpandableSidebarPanel({
  isExpanded,
  isPinned,
  onTogglePin,
  onPersonalize,
  sections,
  className,
  onMouseEnter,
  onMouseLeave,
  currentPage,
  hoveredItem,
  isHoveringSpecificItem,
}: ExpandableSidebarPanelProps) {
  const pathname = usePathname();

  // Get current page name based on pathname
  const getPageName = () => {
    if (currentPage) return currentPage;

    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length === 0) return "Home";
    if (pathSegments[0] === "dashboard") {
      if (pathSegments.length === 1) return "Home";
      if (pathSegments[1] === "scripts") return "Scripts";
      if (pathSegments[1] === "capture") return "Capture";
      return pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1);
    }
    if (pathSegments[0] === "research") return "Research";
    if (pathSegments[0] === "brand") return "Brand";
    if (pathSegments[0] === "settings") return "Settings";

    return pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
  };

  // Check if an item is currently active
  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };


  // Show sub-items when hovering over a specific sidebar item
  const showSubItems = isHoveringSpecificItem && hoveredItem && hoveredItem.subItems && hoveredItem.subItems.length > 0;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed top-0 flex h-full flex-col",
        "border-r shadow-xl",
        "bg-sidebar border-sidebar-border backdrop-blur-sm",
        "group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-lg",
        "transition-all duration-300 ease-out",
        isExpanded ? "translate-x-0 opacity-100 z-[100]" : "translate-x-0 opacity-0 z-[90]",
        className,
      )}
      style={{
        left: isExpanded ? "80px" : "60px", // Slide from behind (20px overlap) to full position
        width: "220px",
        paddingLeft: "8px", // Small padding for content
        transform: isExpanded ? "translateX(0)" : "translateX(-20px)", // Additional slide effect
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >

      {/* Header */}
      <div className="group/sidebar-menu-header border-sidebar-border/30 relative mb-3 flex min-h-0 items-center justify-between border-b px-2 py-3">
        <span>
          <div className="group text-sidebar-foreground relative cursor-pointer text-sm leading-[1.125rem] font-medium transition-colors duration-200 select-none">
            <span className="bg-sidebar-accent absolute -inset-x-2 -inset-y-1 rounded-md opacity-0 duration-200 group-hover:opacity-50"></span>
            <span className="relative flex items-center gap-1">
              {showSubItems ? hoveredItem?.title : getPageName()}
              <ChevronDown className="text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 size-4 opacity-0 transition-all duration-200 group-hover:rotate-180 group-hover/sidebar-menu-header:opacity-100" />
            </span>
          </div>
        </span>

        <div className="flex min-h-6 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePin}
            className={cn(
              "h-7 w-7 p-0 transition-all duration-200 ease-out",
              "group/button relative items-center justify-center text-center select-none",
              "hover:bg-sidebar-accent/50 cursor-pointer rounded-lg",
              "focus:ring-primary/20 focus:ring-2 focus:outline-none",
              "active:scale-[0.95] active:duration-100",
              isPinned
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/70",
            )}
            aria-label={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
            data-testid="sidebar-pin-sidebar"
          >
            <div className="flex min-w-0 items-center justify-center gap-1 font-medium">
              <div className="flex size-3.5 shrink-0 items-center justify-center">
                <Pin
                  className={cn(
                    "h-3.5 w-3.5 transition-all duration-200",
                    isPinned ? "rotate-0 fill-current" : "rotate-45 group-hover/button:rotate-12",
                  )}
                />
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        <div className="w-full text-sm">
          {showSubItems ? (
            /* Show sub-items when hovering over a specific sidebar item */
            <div className="relative flex w-full min-w-0 flex-col p-2">
              {/* Sub-items header */}
              <div className="text-sidebar-foreground/60 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-semibold tracking-wider uppercase">
                {hoveredItem?.title}
              </div>

              {/* Sub-items */}
              <div className="flex w-full min-w-0 flex-col gap-1">
                {hoveredItem?.subItems?.map((subItem) => {
                  const isActive = isItemActive(subItem.href);
                  return (
                    <div key={subItem.id} className="group/menu-item relative">
                      <a
                        href={subItem.href}
                        className={cn(
                          "group relative block rounded-lg px-2 py-1.5 transition-all duration-200",
                          "focus:ring-primary/20 focus:ring-2 focus:outline-none",
                          "active:scale-[0.98] active:duration-75",
                        )}
                      >
                        <div className="group relative block">
                          {/* Background states */}
                          <div
                            className={cn(
                              "absolute -inset-x-2 -inset-y-1 rounded-md transition-all duration-200",
                              isActive
                                ? "bg-primary/10 opacity-100"
                                : "bg-sidebar-accent opacity-0 group-hover:opacity-100 group-focus:opacity-50",
                            )}
                          />

                          <div
                            className={cn(
                              "relative flex items-center gap-2 text-sm transition-colors duration-200",
                              isActive
                                ? "text-primary font-medium"
                                : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground group-focus:text-sidebar-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center transition-colors duration-200",
                                isActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70",
                              )}
                            >
                              {subItem.icon}
                            </div>
                            <span
                              className="w-full overflow-hidden whitespace-nowrap transition-transform duration-200 group-hover:translate-x-0.5"
                              style={{
                                maskImage: "linear-gradient(to right, black 85%, transparent 97%)",
                              }}
                            >
                              {subItem.title}
                            </span>

                            {/* Action button */}
                            <span
                              className={cn(
                                "absolute top-1/2 -right-1 -translate-y-1/2 pl-2 transition-all duration-200",
                                "opacity-0 group-hover:opacity-100 group-focus:opacity-70",
                              )}
                              style={{
                                maskImage: "linear-gradient(to left, black 60%, transparent)",
                              }}
                            >
                              <div className="hover:bg-sidebar-accent/50 rounded p-1 transition-all duration-150 hover:scale-110">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors duration-150"
                                >
                                  <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                  <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                  <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                </svg>
                              </div>
                            </span>
                          </div>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Show regular sections when not hovering over a specific item */
            sections.map((section, sectionIndex) => (
              <div key={section.title} className="relative flex w-full min-w-0 flex-col p-2">
                {/* Section header */}
                <div className="text-sidebar-foreground/60 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-semibold tracking-wider uppercase">
                  {section.title}
                </div>

                {/* Section items */}
                <div className="flex w-full min-w-0 flex-col gap-1">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item.href);
                    return (
                      <div key={item.id} className="group/menu-item relative">
                        <a
                          href={item.href}
                          className={cn(
                            "group relative block rounded-lg px-2 py-1.5 transition-all duration-200",
                            "focus:ring-primary/20 focus:ring-2 focus:outline-none",
                            "active:scale-[0.98] active:duration-75",
                          )}
                        >
                          <div className="group relative block">
                            {/* Background states */}
                            <div
                              className={cn(
                                "absolute -inset-x-2 -inset-y-1 rounded-md transition-all duration-200",
                                isActive
                                  ? "bg-primary/10 opacity-100"
                                  : "bg-sidebar-accent opacity-0 group-hover:opacity-100 group-focus:opacity-50",
                              )}
                            />

                            <div
                              className={cn(
                                "relative flex items-center gap-2 text-sm transition-colors duration-200",
                                isActive
                                  ? "text-primary font-medium"
                                  : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground group-focus:text-sidebar-foreground",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex size-4 shrink-0 items-center justify-center transition-colors duration-200",
                                  isActive
                                    ? "text-primary"
                                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70",
                                )}
                              >
                                {item.icon}
                              </div>
                              <span
                                className="w-full overflow-hidden whitespace-nowrap transition-transform duration-200 group-hover:translate-x-0.5"
                                style={{
                                  maskImage: "linear-gradient(to right, black 85%, transparent 97%)",
                                }}
                              >
                                {item.title}
                              </span>

                              {/* Action button */}
                              <span
                                className={cn(
                                  "absolute top-1/2 -right-1 -translate-y-1/2 pl-2 transition-all duration-200",
                                  "opacity-0 group-hover:opacity-100 group-focus:opacity-70",
                                )}
                                style={{
                                  maskImage: "linear-gradient(to left, black 60%, transparent)",
                                }}
                              >
                                <div className="hover:bg-sidebar-accent/50 rounded p-1 transition-all duration-150 hover:scale-110">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors duration-150"
                                  >
                                    <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                    <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                  </svg>
                                </div>
                              </span>
                            </div>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Default data for the sidebar panel
export const defaultSidebarSections: NavigationSection[] = [
  {
    title: "Quick Actions",
    items: [
      {
        id: "new-script",
        title: "New Script",
        href: "/dashboard/scripts/new",
        icon: sampleIcons.star,
      },
      {
        id: "new-collection",
        title: "New Collection",
        href: "/research/collections/new",
        icon: sampleIcons.spaces,
      },
      {
        id: "upload-video",
        title: "Upload Video",
        href: "/research/upload",
        icon: sampleIcons.cpu,
      },
    ],
  },
  {
    title: "Library",
    items: [
      {
        id: "recent-scripts",
        title: "Recent Scripts",
        href: "/dashboard/scripts",
        icon: sampleIcons.star,
      },
      {
        id: "saved-collections",
        title: "Saved Collections",
        href: "/research/collections",
        icon: sampleIcons.spaces,
      },
      {
        id: "favorites",
        title: "Favorites",
        href: "/dashboard/favorites",
        icon: sampleIcons.dollar,
      },
      {
        id: "notes",
        title: "Notes",
        href: "/dashboard/notes",
        icon: sampleIcons.palette,
      },
    ],
  },
];
