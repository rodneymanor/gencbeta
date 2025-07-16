"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Search, Filter, Calendar, Hash, Tag, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { GhostWriterCard } from "@/components/ghost-writer-card";
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

  const handleUseIdea = (idea: ContentIdea) => {
    // Navigate to script creation with the idea
    const queryParams = new URLSearchParams({
      hook: idea.hook,
      concept: idea.concept || "",
      duration: idea.estimatedDuration,
      peqCategory: idea.peqCategory || "",
    });

    window.open(`/dashboard/scripts/new?${queryParams.toString()}`, "_blank");
  };

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
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ghost Writer Library</h1>
          <p className="text-muted-foreground">Browse and manage your historical Ghost Writer generations</p>
        </div>
        <Button onClick={fetchLibraryData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
              <Hash className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIdeas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Generation Cycles</CardTitle>
              <Calendar className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCycles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hook Templates</CardTitle>
              <Tag className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hookTemplatesUsed.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  ideas.filter((idea) => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(idea.createdAt) >= weekAgo;
                  }).length
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search hooks, concepts..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.peqCategory} onValueChange={(value) => handleFilterChange("peqCategory", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="problem">Problems</SelectItem>
                  <SelectItem value="excuse">Excuses</SelectItem>
                  <SelectItem value="question">Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hook Template</label>
              <Select value={filters.hookTemplate} onValueChange={(value) => handleFilterChange("hookTemplate", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {getUniqueHookTemplates().map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.search && <Badge variant="secondary">Search: {filters.search}</Badge>}
              {filters.peqCategory !== "all" && <Badge variant="secondary">Category: {filters.peqCategory}</Badge>}
              {filters.hookTemplate !== "all" && <Badge variant="secondary">Template: {filters.hookTemplate}</Badge>}
              {filters.dateRange !== "all" && <Badge variant="secondary">Date: {filters.dateRange}</Badge>}
            </div>
            {(filters.search ||
              filters.peqCategory !== "all" ||
              filters.hookTemplate !== "all" ||
              filters.dateRange !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredIdeas.length} {filteredIdeas.length === 1 ? "idea" : "ideas"} found
          </h2>
        </div>

        {filteredIdeas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No ideas found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map((idea) => (
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
