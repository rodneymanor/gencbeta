import { TopBarConfig } from "@/types/topbar";

export interface RouteConfig extends TopBarConfig {
  pattern: string | RegExp;
  priority: number; // Higher priority wins for overlapping patterns
}

// Route-based configurations
export const routeConfigs: RouteConfig[] = [
  // Hemingway Editor - Custom layout with Gen.C Editor title and center toolbar
  {
    pattern: /^\/dashboard\/scripts\/editor/,
    priority: 100,
    showTitle: true,
    titlePosition: "left",
    title: "Gen.C Editor",
    // customContent will be set by the editor component
  },

  // Scripts New - No title
  {
    pattern: /^\/dashboard\/scripts\/new/,
    priority: 90,
    showTitle: false,
    titlePosition: "hidden",
  },

  // Collections - Show title
  {
    pattern: /^\/research\/collections/,
    priority: 80,
    showTitle: true,
    titlePosition: "left",
    // title will be dynamically set by the page
  },

  // Individual Collection - Show title with back button
  {
    pattern: /^\/research\/collections\/[^/]+$/,
    priority: 85,
    showTitle: true,
    titlePosition: "left",
    showBackButton: true,
    backHref: "/research/collections",
    // title will be dynamically set by the page
  },

  // My Brand - Show title
  {
    pattern: /^\/dashboard\/my-brand/,
    priority: 70,
    showTitle: true,
    titlePosition: "left",
    title: "My Brand",
  },

  // Settings - Show title
  {
    pattern: /^\/dashboard\/settings/,
    priority: 70,
    showTitle: true,
    titlePosition: "left",
    title: "Settings",
  },

  // Admin - Show title
  {
    pattern: /^\/dashboard\/admin/,
    priority: 70,
    showTitle: true,
    titlePosition: "left",
    title: "Admin Dashboard",
  },

  // Scripts Library - Show title
  {
    pattern: /^\/dashboard\/scripts$/,
    priority: 70,
    showTitle: true,
    titlePosition: "left",
    title: "Scripts Library",
  },

  // Notes - Show title
  {
    pattern: /^\/dashboard\/capture\/notes/,
    priority: 70,
    showTitle: true,
    titlePosition: "left",
    title: "Notes",
  },

  // Voices - Show title
  {
    pattern: /^\/dashboard\/voices/,
    priority: 70,
    showTitle: true,
    titlePosition: "left",
    title: "Voice Library",
  },

  // Chrome Extension - Show title
  {
    pattern: /^\/dashboard\/tools\/chrome-extension/,
    priority: 70,
    showTitle: true,
    titlePosition: "left",
    title: "Chrome Extension",
  },

  // Default fallback - no title for unlisted pages
  {
    pattern: /.*/,
    priority: 0,
    showTitle: false,
    titlePosition: "hidden",
  },
];

export function getRouteConfig(pathname: string): RouteConfig {
  // Find all matching configs and return the one with highest priority
  const matchingConfigs = routeConfigs.filter((config) => {
    if (typeof config.pattern === "string") {
      return pathname === config.pattern;
    }
    return config.pattern.test(pathname);
  });

  // Sort by priority (highest first) and return the first match
  const sortedConfigs = matchingConfigs.sort((a, b) => b.priority - a.priority);
  return sortedConfigs[0] || routeConfigs[routeConfigs.length - 1]; // fallback to default
}

// Dynamic title resolvers for pages that need context-aware titles
export const titleResolvers = {
  collections: (pathname: string, searchParams?: URLSearchParams) => {
    const collectionParam = searchParams?.get("collection");
    if (collectionParam) {
      // This would ideally fetch from collections context/store
      return "Collection"; // Will be overridden by page component
    }
    return "Collections";
  },

  collectionDetail: (pathname: string) => {
    const matches = pathname.match(/\/research\/collections\/([^/]+)$/);
    if (matches) {
      // This would ideally fetch collection name by ID
      return "Collection"; // Will be overridden by page component
    }
    return "Collection";
  },
};

export function resolveTitle(pathname: string, searchParams?: URLSearchParams): string | undefined {
  if (pathname.startsWith("/research/collections/") && pathname !== "/research/collections") {
    return titleResolvers.collectionDetail(pathname);
  }

  if (pathname === "/research/collections") {
    return titleResolvers.collections(pathname, searchParams);
  }

  return undefined;
}
