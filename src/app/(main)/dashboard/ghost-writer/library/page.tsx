"use client";

import { useState, useEffect, useCallback } from "react";

import { format } from "date-fns";
import {
  Search,
  Filter,
  Calendar,
  Hash,
  Tag,
  Loader2,
  RefreshCw,
  Trash2,
  Grid3X3,
  List,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { GhostWriterCard } from "@/components/ghost-writer-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GhostWriterCryptoTable, type GhostWriterCryptoData } from "@/components/ui/ghost-writer-crypto-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { ContentIdea } from "@/types/ghost-writer";

interface LibraryFilters {
  search: string;
  peqCategory: string;
  dateRange: string;
  hookTemplate: string;
}

interface LibraryStats {
  totalIdeas: number;
  totalCycles: number;
  hookTemplatesUsed: string[];
  generationHistory: Array<{ date: string; count: number }>;
}

export default function GhostWriterLibraryPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<ContentIdea[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<LibraryFilters>({
    search: "",
    peqCategory: "all",
    dateRange: "all",
    hookTemplate: "all",
  });

  const fetchLibraryData = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const token = await user.getIdToken();

      const response = await fetch("/api/ghost-writer/library", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch library data");
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch library data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleIdeaAction = async (ideaId: string, action: "save" | "dismiss") => {
    if (!user) return;

    try {
      const response = await fetch("/api/ghost-writer/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ ideaId, action }),
      });

      if (!response.ok) throw new Error("Failed to manage idea");

      // Update local state to reflect the action
      if (action === "dismiss") {
        setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
        setFilteredIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
      }
    } catch (err) {
      console.error(`Failed to ${action} idea:`, err);
    }
  };

  const handleUseIdea = async (idea: ContentIdea) => {
    // Track usage in the database
    if (user) {
      try {
        const token = await user.getIdToken();
        await fetch("/api/ghost-writer/track-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ideaId: idea.id,
            action: "script_generation",
          }),
        });
      } catch (error) {
        console.error("Failed to track usage:", error);
      }
    }

    // Navigate to script creation with the idea
    const queryParams = new URLSearchParams({
      hook: idea.hook,
      concept: idea.concept || "",
      duration: idea.estimatedDuration,
      peqCategory: idea.peqCategory || "",
    });

    window.open(`/dashboard/scripts/new?${queryParams.toString()}`, "_blank");
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Apply sorting to filtered ideas
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    let aValue: any = a[sortBy as keyof ContentIdea];
    let bValue: any = b[sortBy as keyof ContentIdea];

    // Handle special sorting cases
    if (sortBy === "createdAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const applyFilters = useCallback(() => {
    let filtered = [...ideas];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.hook.toLowerCase().includes(searchLower) ||
          idea.concept?.toLowerCase().includes(searchLower) ||
          idea.sourceText?.toLowerCase().includes(searchLower),
      );
    }

    // PEQ Category filter
    if (filters.peqCategory !== "all") {
      filtered = filtered.filter((idea) => idea.peqCategory === filters.peqCategory);
    }

    // Hook Template filter
    if (filters.hookTemplate !== "all") {
      filtered = filtered.filter((idea) => idea.hookTemplate === filters.hookTemplate);
    }

    // Date Range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      if (filters.dateRange !== "all") {
        filtered = filtered.filter((idea) => new Date(idea.createdAt) >= filterDate);
      }
    }

    setFilteredIdeas(filtered);
  }, [ideas, filters]);

  const handleFilterChange = (key: keyof LibraryFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      peqCategory: "all",
      dateRange: "all",
      hookTemplate: "all",
    });
  };

  const getUniqueHookTemplates = () => {
    const templates = ideas
      .map((idea) => idea.hookTemplate)
      .filter((template): template is string => Boolean(template))
      .filter((template, index, arr) => arr.indexOf(template) === index);
    return templates;
  };

  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchLibraryData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Compact Header with Actions */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ghost Writer Library</h1>
          <p className="text-muted-foreground text-sm">Browse and manage your historical Ghost Writer generations</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Stats - Inline */}
          {stats && (
            <div className="text-muted-foreground hidden items-center gap-4 text-sm md:flex">
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                <span className="font-medium">{stats.totalIdeas}</span>
                <span>ideas</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span className="font-medium">{stats.hookTemplatesUsed.length}</span>
                <span>templates</span>
              </div>
            </div>
          )}
          <Button onClick={fetchLibraryData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar with Filters and View Toggle */}
      <div className="mb-4 space-y-4">
        {/* Top Row: Search, Quick Filters, View Toggle */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search and Quick Filters */}
          <div className="flex flex-1 items-center gap-3">
            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search ideas..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="h-9 pl-10"
              />
            </div>

            {/* Quick Filter Dropdowns */}
            <Select value={filters.peqCategory} onValueChange={(value) => handleFilterChange("peqCategory", value)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="problem">Problems</SelectItem>
                <SelectItem value="excuse">Excuses</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters if any active */}
            {(filters.search || filters.peqCategory !== "all" || filters.dateRange !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* View Toggle and Results Count */}
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">
              {filteredIdeas.length} {filteredIdeas.length === 1 ? "idea" : "ideas"}
            </span>
            <div className="bg-muted/20 rounded-lg border border-gray-200 p-1">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-7 px-2"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Row */}
        {(filters.search ||
          filters.peqCategory !== "all" ||
          filters.hookTemplate !== "all" ||
          filters.dateRange !== "all") && (
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                Search: {filters.search}
              </Badge>
            )}
            {filters.peqCategory !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Category: {filters.peqCategory}
              </Badge>
            )}
            {filters.hookTemplate !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Template: {filters.hookTemplate}
              </Badge>
            )}
            {filters.dateRange !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Date: {filters.dateRange}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div>
        {ideas.length === 0 ? (
          // Empty state - no Ghost Writer ideas generated yet
          <Card className="rounded-xl border border-gray-200">
            <CardContent className="py-16 text-center">
              <div className="mx-auto max-w-md">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#2d93ad]/10 to-[#412722]/10">
                    <Sparkles className="h-8 w-8 text-[#2d93ad]" />
                  </div>
                  <h3 className="text-foreground text-xl font-semibold">Start Using Ghost Writer</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    Generate AI-powered content ideas and track your script creation history. generations will appear
                    here.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button onClick={() => (window.location.href = "/dashboard/scripts/new")} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Your First Ideas
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    Visit the Scripts page to get started with Ghost Writer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredIdeas.length === 0 ? (
          // Filtered state - ideas exist but none match current filters
          <Card className="rounded-xl border border-gray-200">
            <CardContent className="py-12 text-center">
              <div className="mx-auto max-w-md">
                <p className="text-muted-foreground mb-4">No ideas found matching your current filters.</p>
                <Button variant="outline" onClick={clearFilters}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <GhostWriterCryptoTable
            data={sortedIdeas}
            onUseIdea={handleUseIdea}
            onViewUsage={(idea) => {
              console.log("View usage details for", idea.id);
              toast.info("Usage details coming soon");
            }}
            onRowClick={(idea) => {
              console.log("Clicked on idea", idea.id);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedIdeas.map((idea) => (
              <div key={idea.id} className="relative">
                <GhostWriterCard idea={idea} onSave={handleIdeaAction} onUse={handleUseIdea} className="h-full" />
                <div className="absolute top-2 right-2 space-y-1">
                  {idea.peqCategory && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        idea.peqCategory === "problem" && "border-red-200 bg-red-50 text-red-700",
                        idea.peqCategory === "excuse" && "border-yellow-200 bg-yellow-50 text-yellow-700",
                        idea.peqCategory === "question" && "border-blue-200 bg-blue-50 text-blue-700",
                      )}
                    >
                      {idea.peqCategory}
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground mt-2 text-center text-xs">
                  {format(new Date(idea.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
