"use client";

import { Plus, Settings, ArrowUpDown, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ColumnVisibility {
  title: boolean;
  authors: boolean;
  added: boolean;
  viewed: boolean;
  fileType: boolean;
  summary: boolean;
}

interface ScriptsControlsProps {
  statusFilter: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  columnVisibility: ColumnVisibility;
  onStatusFilterChange: (filter: string) => void;
  onSort: (column: string) => void;
  onToggleColumnVisibility: (column: keyof ColumnVisibility) => void;
}

// eslint-disable-next-line complexity
export function ScriptsControls({
  statusFilter,
  sortBy,
  sortOrder,
  columnVisibility,
  onStatusFilterChange,
  onSort,
  onToggleColumnVisibility,
}: ScriptsControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* View Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              View settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={columnVisibility.title}
              onCheckedChange={() => onToggleColumnVisibility("title")}
            >
              Title
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.authors}
              onCheckedChange={() => onToggleColumnVisibility("authors")}
            >
              Authors
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.added}
              onCheckedChange={() => onToggleColumnVisibility("added")}
            >
              Added
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.viewed}
              onCheckedChange={() => onToggleColumnVisibility("viewed")}
            >
              Viewed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.fileType}
              onCheckedChange={() => onToggleColumnVisibility("fileType")}
            >
              File type
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.summary}
              onCheckedChange={() => onToggleColumnVisibility("summary")}
            >
              Summary
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSort("title")}>
              Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("authors")}>
              Authors {sortBy === "authors" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("added")}>
              Date Added {sortBy === "added" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("viewed")}>
              Date Viewed {sortBy === "viewed" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("fileType")}>
              File Type {sortBy === "fileType" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusFilterChange("all")}>
              All Status {statusFilter === "all" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("published")}>
              Published {statusFilter === "published" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("draft")}>
              Draft {statusFilter === "draft" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("scheduled")}>
              Scheduled {statusFilter === "scheduled" && "✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Add Button */}
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        Add or create
      </Button>
    </div>
  );
}
