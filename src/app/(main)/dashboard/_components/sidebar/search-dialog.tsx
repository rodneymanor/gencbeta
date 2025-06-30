"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

import { Search, Clock, ArrowRight } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { SearchService, type SearchData, type SearchResult } from "@/lib/search-service";

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
  }, [open, user, userProfile]);

  const loadSearchData = async () => {
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
  };

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

  const handleSelect = (result: SearchResult) => {
    console.log("🔍 [SearchDialog] Navigating to:", result.url);
    setOpen(false);
    setQuery("");
    router.push(result.url);
  };

  const getTotalResultsCount = () => {
    return searchResults.collections.length + 
           searchResults.videos.length + 
           searchResults.notes.length + 
           searchResults.scripts.length +
           searchResults.pages.length;
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

  const renderSearchGroup = (title: string, items: SearchResult[], emptyMessage: string) => {
    if (items.length === 0 && query.trim()) return null;

    return (
      <>
        <CommandSeparator />
        <CommandGroup heading={title}>
          {items.length === 0 ? (
            query.trim() && (
              <CommandItem disabled>
                <span className="text-muted-foreground text-sm">{emptyMessage}</span>
              </CommandItem>
            )
          ) : (
            items.map((item) => (
              <CommandItem
                key={`${item.type}-${item.id}`}
                className="!py-2 cursor-pointer"
                onSelect={() => handleSelect(item)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.title}</span>
                    {item.metadata?.author && (
                      <Badge variant="outline" className="text-xs">
                        {item.metadata.author}
                      </Badge>
                    )}
                    {item.metadata?.category && item.type === "page" && (
                      <Badge variant="secondary" className="text-xs">
                        {item.metadata.category}
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs truncate mt-1">
                    {item.description}
                  </div>
                  {item.metadata?.createdAt && item.type !== "page" && (
                    <div className="text-muted-foreground text-xs mt-1">
                      {formatDate(item.metadata.createdAt)}
                    </div>
                  )}
                </div>
                <ArrowRight className="ml-2 h-3 w-3 opacity-50" />
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </>
    );
  };

  const renderLoadingState = () => (
    <>
      <CommandGroup heading="Loading...">
        {Array.from({ length: 6 }).map((_, i) => (
          <CommandItem key={i} disabled>
            <Skeleton className="mr-2 h-4 w-4" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );

  const renderEmptyState = () => {
    if (query.trim()) {
      return (
        <CommandEmpty>
          <div className="text-center py-6">
            <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No results found for "{query}"</p>
            <p className="text-muted-foreground text-sm mt-1">
              Try searching for pages, collections, videos, notes, or scripts
            </p>
          </div>
        </CommandEmpty>
      );
    }

    return (
      <div className="py-6 text-center text-muted-foreground">
        <Search className="mx-auto h-8 w-8 mb-2" />
        <p>Search pages, collections, videos, notes, and scripts</p>
        <p className="text-sm mt-1">Start typing to see results</p>
      </div>
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
        <kbd className="bg-muted inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search pages, collections, videos, notes, and scripts..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {(isLoading || isInitialLoad) ? (
            renderLoadingState()
          ) : !searchData ? (
            <CommandEmpty>
              <div className="text-center py-6">
                <p className="text-muted-foreground">Failed to load search data</p>
                <p className="text-muted-foreground text-sm mt-1">Please try again</p>
              </div>
            </CommandEmpty>
          ) : getTotalResultsCount() === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {query.trim() && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                  {getTotalResultsCount()} result{getTotalResultsCount() !== 1 ? 's' : ''} found
                </div>
              )}
              
              {renderSearchGroup(
                "Pages", 
                searchResults.pages, 
                "No pages found"
              )}
              
              {renderSearchGroup(
                "Collections", 
                searchResults.collections, 
                "No collections found"
              )}
              
              {renderSearchGroup(
                "Videos", 
                searchResults.videos, 
                "No videos found"
              )}
              
              {renderSearchGroup(
                "Notes", 
                searchResults.notes, 
                "No notes found"
              )}
              
              {renderSearchGroup(
                "Scripts", 
                searchResults.scripts, 
                "No scripts found"
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
