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

  if (!isExpanded) return null;

  // Show sub-items when hovering over a specific sidebar item
  const showSubItems = isHoveringSpecificItem && hoveredItem && hoveredItem.subItems && hoveredItem.subItems.length > 0;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed top-0 z-[100] flex h-full flex-col",
        "border-r shadow-lg duration-200 ease-out",
        "bg-sidebar border-sidebar-border",
        "group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-lg",
        className,
      )}
      style={{
        left: "80px", // Position it right after the collapsed sidebar
        width: "220px",
        paddingLeft: "8px", // Small padding for content
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Invisible overlay area */}
      <div className="absolute inset-y-0 -right-6 left-0" />

      {/* Header */}
      <div className="group/sidebar-menu-header border-border/50 relative mb-3 flex min-h-0 items-center justify-between border-b py-3">
        <span>
          <div className="group relative cursor-pointer text-sm leading-[1.125rem] font-medium text-gray-700 select-none dark:text-gray-300">
            <span className="bg-sidebar-accent absolute -inset-x-2 -inset-y-1 rounded-md opacity-0 duration-100 group-hover:opacity-100"></span>
            <span className="relative flex items-center gap-1">
              {showSubItems ? hoveredItem?.title : getPageName()}
              <ChevronDown className="size-4 text-gray-400 opacity-0 duration-100 group-hover:text-gray-600 group-hover/sidebar-menu-header:opacity-100 dark:group-hover:text-gray-200" />
            </span>
          </div>
        </span>

        <div className="flex min-h-6 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePin}
            className={cn(
              "h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              "transition duration-300 ease-out",
              "group/button relative items-center justify-center text-center select-none",
              "cursor-pointer rounded-lg active:scale-[0.97] active:duration-150",
              isPinned &&
                "text-gray-800 dark:text-gray-200",
            )}
            aria-label={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
            data-testid="sidebar-pin-sidebar"
          >
            <div className="flex min-w-0 items-center justify-center gap-1 font-medium">
              <div className="flex size-3.5 shrink-0 items-center justify-center">
                <Pin
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200", 
                    isPinned ? "rotate-0 fill-gray-800 dark:fill-gray-200" : "rotate-45"
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
              <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                {hoveredItem?.title}
              </div>

              {/* Sub-items */}
              <div className="flex w-full min-w-0 flex-col gap-1">
                {hoveredItem?.subItems?.map((subItem) => (
                  <div key={subItem.id} className="group/menu-item relative">
                    <a href={subItem.href} className="group relative block">
                      <div className="group relative block">
                        <div className="bg-sidebar-accent absolute -inset-x-2 -inset-y-1 rounded-md opacity-0 duration-200 group-hover:opacity-100" />
                        <div className="relative flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex size-4 shrink-0 items-center justify-center text-gray-500 dark:text-gray-400">
                            {subItem.icon}
                          </div>
                          <span
                            className="w-full overflow-hidden whitespace-nowrap"
                            style={{
                              maskImage: "linear-gradient(to right, black 85%, transparent 97%)",
                            }}
                          >
                            {subItem.title}
                          </span>
                          <span
                            className="bg-sidebar-accent absolute top-1/2 -right-1 -translate-y-1/2 pl-2 opacity-0 duration-200 group-hover:opacity-100"
                            style={{
                              maskImage: "linear-gradient(to left, black 60%, transparent)",
                            }}
                          >
                            <div className="hover:bg-sidebar-accent/50 rounded p-1 duration-150">
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
                                className="text-gray-400 duration-150 hover:text-gray-600 dark:hover:text-gray-200"
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
                ))}
              </div>
            </div>
          ) : (
            /* Show regular sections when not hovering over a specific item */
            sections.map((section, sectionIndex) => (
              <div key={section.title} className="relative flex w-full min-w-0 flex-col p-2">
                {/* Section header */}
                <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {section.title}
                </div>

                {/* Section items */}
                <div className="flex w-full min-w-0 flex-col gap-1">
                  {section.items.map((item) => (
                    <div key={item.id} className="group/menu-item relative">
                      <a href={item.href} className="group relative block">
                        <div className="group relative block">
                          <div className="bg-sidebar-accent absolute -inset-x-2 -inset-y-1 rounded-md opacity-0 duration-200 group-hover:opacity-100" />
                          <div className="relative flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex size-4 shrink-0 items-center justify-center text-gray-500 dark:text-gray-400">
                              {item.icon}
                            </div>
                            <span
                              className="w-full overflow-hidden whitespace-nowrap"
                              style={{
                                maskImage: "linear-gradient(to right, black 85%, transparent 97%)",
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              className="bg-sidebar-accent absolute top-1/2 -right-1 -translate-y-1/2 pl-2 opacity-0 duration-200 group-hover:opacity-100"
                              style={{
                                maskImage: "linear-gradient(to left, black 60%, transparent)",
                              }}
                            >
                              <div className="hover:bg-sidebar-accent/50 rounded p-1 duration-150">
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
                                  className="text-gray-400 duration-150 hover:text-gray-600 dark:hover:text-gray-200"
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
                  ))}
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
