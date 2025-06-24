import { Search, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  availableTags: Array<{ name: string; color: string }>;
}

export function SearchFilters({
  searchQuery,
  setSearchQuery,
  selectedTags,
  toggleTag,
  clearFilters,
  sortBy,
  setSortBy,
  availableTags,
}: SearchFiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="created">Recently Created</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="starred">Starred First</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by tags:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <Badge
                key={tag.name}
                variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                className={`cursor-pointer text-xs ${selectedTags.includes(tag.name) ? tag.color + " text-white" : ""}`}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-6 text-xs">
              Clear filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
