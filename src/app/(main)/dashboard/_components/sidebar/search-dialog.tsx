"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Search, Mic, Wand2 } from "lucide-react";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { useAuth } from "@/contexts/auth-context";
import { SearchService, type SearchData, type SearchResult } from "@/lib/search-service";

import { SearchResultGroup, SearchLoadingState, QuickActionItem } from "./search-result-components";

// Default actions available to all users
const defaultActions = [
  {
    id: "create-script",
    title: "Create Script",
    description: "Generate a new script with AI assistance",
    url: "/dashboard/scripts/new",
    icon: Wand2,
  },
  {
    id: "new-recording",
    title: "New Recording",
    description: "Record voice notes or ideas",
    url: "/dashboard/capture/voice",
    icon: Mic,
  },
];

export function SearchDialog() {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [searchData, setSearchData] = React.useState<SearchData | null>(null);
  const [searchResults, setSearchResults] = React.useState<{
    collections: SearchResult[];
    videos: SearchResult[];
    notes: SearchResult[];
    scripts: SearchResult[];
    pages: SearchResult[];
  }>({
    collections: [],
    videos: [],
    notes: [],
    scripts: [],
    pages: [],
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Load search data when dialog opens
  const loadSearchData = React.useCallback(async () => {
    if (!user || !userProfile) return;

    setIsLoading(true);
    setIsInitialLoad(true);

    try {
      console.log("🔍 [SearchDialog] Loading search data...");
      const data = await SearchService.getSearchData(user.uid);
      setSearchData(data);
      console.log("✅ [SearchDialog] Search data loaded");
    } catch (error) {
      console.error("❌ [SearchDialog] Failed to load search data:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [user, userProfile]);

  // Debounced search effect
  React.useEffect(() => {
    if (!query.trim() || !searchData) {
      setSearchResults({
        collections: [],
        videos: [],
        notes: [],
        scripts: [],
        pages: [],
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      const results = SearchService.searchByCategory(searchData, query);
      setSearchResults(results);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchData]);

  // Load search data when dialog opens
  React.useEffect(() => {
    if (open && user && userProfile && !searchData) {
      loadSearchData();
    }
  }, [open, user, userProfile, searchData, loadSearchData]);

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (result: SearchResult | (typeof defaultActions)[0]) => {
    console.log("🔍 [SearchDialog] Navigating to:", result.url);
    setOpen(false);
    setQuery("");
    router.push(result.url);
  };

  const getTotalResultsCount = () => {
    return (
      searchResults.collections.length +
      searchResults.videos.length +
      searchResults.notes.length +
      searchResults.scripts.length +
      searchResults.pages.length
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getRecentScripts = () => {
    if (!searchData) return [];

    return searchData.scripts
      .sort((a, b) => {
        const dateA = new Date(a.metadata?.createdAt ?? "");
        const dateB = new Date(b.metadata?.createdAt ?? "");
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5); // Show latest 5 scripts
  };

  const renderDefaultContent = () => {
    if (isLoading || isInitialLoad) {
      return <SearchLoadingState />;
    }

    const recentScripts = getRecentScripts();

    return (
      <>
        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          {defaultActions.map((action) => (
            <QuickActionItem key={action.id} action={action} onSelect={handleSelect} />
          ))}
        </CommandGroup>

        {/* Recent Scripts */}
        <SearchResultGroup
          title="Recent Scripts"
          items={recentScripts}
          emptyMessage="No recent scripts found"
          onSelect={handleSelect}
          formatDate={formatDate}
        />
      </>
    );
  };

  const renderSearchResults = () => {
    if (getTotalResultsCount() === 0) {
      return (
        <CommandEmpty>
          <div className="py-6 text-center">
            <Search className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Try searching for pages, collections, videos, notes, or scripts
            </p>
          </div>
        </CommandEmpty>
      );
    }

    return (
      <>
        <div className="text-muted-foreground border-b px-2 py-1.5 text-xs">
          {getTotalResultsCount()} result{getTotalResultsCount() !== 1 ? "s" : ""} found
        </div>

        <SearchResultGroup
          title="Pages"
          items={searchResults.pages}
          emptyMessage="No pages found"
          onSelect={handleSelect}
          formatDate={formatDate}
        />
        <SearchResultGroup
          title="Collections"
          items={searchResults.collections}
          emptyMessage="No collections found"
          onSelect={handleSelect}
          formatDate={formatDate}
        />
        <SearchResultGroup
          title="Videos"
          items={searchResults.videos}
          emptyMessage="No videos found"
          onSelect={handleSelect}
          formatDate={formatDate}
        />
        <SearchResultGroup
          title="Notes"
          items={searchResults.notes}
          emptyMessage="No notes found"
          onSelect={handleSelect}
          formatDate={formatDate}
        />
        <SearchResultGroup
          title="Scripts"
          items={searchResults.scripts}
          emptyMessage="No scripts found"
          onSelect={handleSelect}
          formatDate={formatDate}
        />
      </>
    );
  };

  return (
    <>
      <div
        className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search
        <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-transparent px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search or create..." value={query} onValueChange={setQuery} />
        <CommandList>
          {!searchData ? (
            <CommandEmpty>
              <div className="py-6 text-center">
                <p className="text-muted-foreground">Failed to load search data</p>
                <p className="text-muted-foreground mt-1 text-sm">Please try again</p>
              </div>
            </CommandEmpty>
          ) : query.trim() ? (
            renderSearchResults()
          ) : (
            renderDefaultContent()
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
