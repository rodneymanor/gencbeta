import {
  type LucideIcon,
  FolderOpen,
  StickyNote,
  FileText,
  Play,
  Home,
  Binoculars,
  Settings,
  Users,
  WandSparkles,
} from "lucide-react";

import { CollectionsRBACService } from "./collections-rbac";
import { getMockNotesData, getMockScriptsData } from "./search-mock-data";
import { UserManagementService } from "./user-management";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "collection" | "video" | "note" | "script" | "page";
  url: string;
  icon: LucideIcon;
  metadata?: {
    author?: string;
    createdAt?: string;
    videoCount?: number;
    platform?: string;
    tags?: string[];
    category?: string;
  };
}

export interface SearchData {
  collections: SearchResult[];
  videos: SearchResult[];
  notes: SearchResult[];
  scripts: SearchResult[];
  pages: SearchResult[];
  all: SearchResult[];
}

export class SearchService {
  private static cachedData: SearchData | null = null;
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all searchable data for the current user
   */
  static async getSearchData(userUid: string): Promise<SearchData> {
    // Return cached data if it's still fresh
    if (this.cachedData && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      console.log("🔍 [SEARCH] Loading search data for user:", userUid);

      const [collections, videos, notes, scripts, pages] = await Promise.all([
        this.getCollectionsData(userUid),
        this.getVideosData(userUid),
        this.getNotesData(),
        this.getScriptsData(),
        this.getNavigationPages(userUid),
      ]);

      const searchData: SearchData = {
        collections,
        videos,
        notes,
        scripts,
        pages,
        all: [...collections, ...videos, ...notes, ...scripts, ...pages],
      };

      this.cachedData = searchData;
      this.lastFetch = Date.now();

      console.log("✅ [SEARCH] Search data loaded:", {
        collections: collections.length,
        videos: videos.length,
        notes: notes.length,
        scripts: scripts.length,
        pages: pages.length,
        total: searchData.all.length,
      });

      return searchData;
    } catch (error) {
      console.error("❌ [SEARCH] Error loading search data:", error);

      // Return empty data on error
      const emptyData: SearchData = {
        collections: [],
        videos: [],
        notes: [],
        scripts: [],
        pages: [],
        all: [],
      };

      return emptyData;
    }
  }

  /**
   * Search through all data
   */
  static searchAll(data: SearchData, query: string): SearchResult[] {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();

    return data.all.filter((item) => this.matchesSearchTerm(item, searchTerm)).slice(0, 20); // Limit results
  }

  /**
   * Search with categories
   */
  static searchByCategory(
    data: SearchData,
    query: string,
  ): {
    collections: SearchResult[];
    videos: SearchResult[];
    notes: SearchResult[];
    scripts: SearchResult[];
    pages: SearchResult[];
  } {
    if (!query.trim()) {
      return {
        collections: [],
        videos: [],
        notes: [],
        scripts: [],
        pages: [],
      };
    }

    const searchTerm = query.toLowerCase().trim();

    const filterItems = (items: SearchResult[]) =>
      items.filter((item) => this.matchesSearchTerm(item, searchTerm)).slice(0, 5); // Limit per category

    return {
      collections: filterItems(data.collections),
      videos: filterItems(data.videos),
      notes: filterItems(data.notes),
      scripts: filterItems(data.scripts),
      pages: filterItems(data.pages),
    };
  }

  /**
   * Check if an item matches the search term
   */
  private static matchesSearchTerm(item: SearchResult, searchTerm: string): boolean {
    const lowerTerm = searchTerm.toLowerCase();

    // Check title and description
    if (item.title.toLowerCase().includes(lowerTerm) || item.description.toLowerCase().includes(lowerTerm)) {
      return true;
    }

    // Check metadata fields
    if (item.metadata) {
      if (
        item.metadata.author?.toLowerCase().includes(lowerTerm) ||
        item.metadata.category?.toLowerCase().includes(lowerTerm)
      ) {
        return true;
      }

      // Check tags
      if (item.metadata.tags?.some((tag) => tag.toLowerCase().includes(lowerTerm))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear cache (useful when data changes)
   */
  static clearCache(): void {
    this.cachedData = null;
    this.lastFetch = 0;
  }

  /**
   * Get navigation pages based on user role
   */
  private static async getNavigationPages(userUid: string): Promise<SearchResult[]> {
    try {
      const userProfile = await UserManagementService.getUserProfile(userUid);
      if (!userProfile) return [];

      const commonPages = this.getCommonNavigationPages();
      const rolePages = this.getRoleSpecificPages(userProfile.role);

      return [...commonPages, ...rolePages];
    } catch (error) {
      console.error("❌ [SEARCH] Error loading navigation pages:", error);
      return [];
    }
  }

  /**
   * Get common navigation pages for all users
   */
  private static getCommonNavigationPages(): SearchResult[] {
    return [
      {
        id: "dashboard",
        title: "Dashboard",
        description: "Main dashboard and overview",
        type: "page",
        url: "/dashboard",
        icon: Home,
        metadata: { category: "Navigation" },
      },
      {
        id: "new-script",
        title: "New Script",
        description: "Create a new script with AI assistance",
        type: "page",
        url: "/dashboard/scripts/new",
        icon: WandSparkles,
        metadata: { category: "Creation" },
      },
      {
        id: "script-editor",
        title: "Script Editor",
        description: "AI-powered script editing and refinement",
        type: "page",
        url: "/dashboard/scripts/editor",
        icon: FileText,
        metadata: { category: "Creation" },
      },
      {
        id: "notes",
        title: "Notes",
        description: "Capture and organize your ideas",
        type: "page",
        url: "/ideas/notes",
        icon: StickyNote,
        metadata: { category: "Ideas" },
      },
      {
        id: "research",
        title: "Research",
        description: "Browse and analyze video content",
        type: "page",
        url: "/research",
        icon: Binoculars,
        metadata: { category: "Research" },
      },
      {
        id: "collections",
        title: "Collections",
        description: "Video collections and content libraries",
        type: "page",
        url: "/research/collections",
        icon: FolderOpen,
        metadata: { category: "Research" },
      },
    ];
  }

  /**
   * Get role-specific navigation pages
   */
  private static getRoleSpecificPages(role: string): SearchResult[] {
    const pages: SearchResult[] = [];

    if (role === "coach" || role === "super_admin") {
      pages.push({
        id: "creators",
        title: "My Creators",
        description: "Manage your content creators",
        type: "page",
        url: "/dashboard/creators",
        icon: Users,
        metadata: { category: "Team" },
      });
    }

    if (role === "super_admin") {
      pages.push({
        id: "admin",
        title: "User Management",
        description: "Manage users and permissions",
        type: "page",
        url: "/dashboard/admin",
        icon: Settings,
        metadata: { category: "Administration" },
      });
    }

    return pages;
  }

  /**
   * Get collections data
   */
  private static async getCollectionsData(userUid: string): Promise<SearchResult[]> {
    try {
      const collections = await CollectionsRBACService.getUserCollections(userUid);

      return collections.map((collection) => ({
        id: collection.id!,
        title: collection.title,
        description: collection.description ?? "No description",
        type: "collection" as const,
        url: `/research/collections/${collection.id}`,
        icon: FolderOpen,
        metadata: {
          videoCount: collection.videoCount,
          createdAt: collection.createdAt,
          category: "Collections",
        },
      }));
    } catch (error) {
      console.error("❌ [SEARCH] Error loading collections:", error);
      return [];
    }
  }

  /**
   * Get videos data
   */
  private static async getVideosData(userUid: string): Promise<SearchResult[]> {
    try {
      // Get all videos across all collections for this user (automatically deduplicated)
      const result = await CollectionsRBACService.getCollectionVideos(userUid, "all-videos");
      const videos = result.videos;

      return videos.map((video) => ({
        id: video.id!,
        title: video.title,
        description: video.transcript ? video.transcript.substring(0, 100) + "..." : "No transcript available",
        type: "video" as const,
        url: `/research/collections/${video.collectionId ?? "all-videos"}?video=${video.id}`,
        icon: Play,
        metadata: {
          author: video.author,
          platform: video.platform,
          createdAt: video.addedAt,
          tags: video.contentMetadata?.hashtags ?? [],
          category: "Videos",
        },
      }));
    } catch (error) {
      console.error("❌ [SEARCH] Error loading videos:", error);
      return [];
    }
  }

  /**
   * Get notes data (currently mock data - replace with real API when available)
   */
  private static async getNotesData(): Promise<SearchResult[]> {
    return getMockNotesData();
  }

  /**
   * Get scripts data (currently mock data - replace with real API when available)
   */
  private static async getScriptsData(): Promise<SearchResult[]> {
    return getMockScriptsData();
  }
}
