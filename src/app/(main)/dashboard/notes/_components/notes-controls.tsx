"use client";

import { useState } from "react";

import { Download, Trash2, Search, Eye, EyeOff } from "lucide-react";
import { IconSettings } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface ColumnVisibility {
  title: boolean;
  tags: boolean;
  created: boolean;
  updated: boolean;
  starred: boolean;
  content: boolean;
}

interface NotesControlsProps {
  totalNotes: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (visibility: ColumnVisibility) => void;
  onSearch: (query: string) => void;
}

export function NotesControls({
  totalNotes,
  selectedCount,
  onSelectAll,
  onDeleteSelected,
  onExportSelected,
  columnVisibility,
  onColumnVisibilityChange,
  onSearch,
}: NotesControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleColumnToggle = (column: keyof ColumnVisibility) => {
    const newVisibility = { ...columnVisibility };
    // eslint-disable-next-line security/detect-object-injection
    newVisibility[column] = !newVisibility[column];
    onColumnVisibilityChange(newVisibility);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Info */}
        <div className="text-muted-foreground text-sm">
          {totalNotes} notes
          {selectedCount > 0 && ` • ${selectedCount} selected`}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Select All */}
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          {selectedCount === totalNotes && totalNotes > 0 ? "Deselect All" : "Select All"}
        </Button>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onExportSelected}>
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedCount})
            </Button>
            <Button variant="outline" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedCount})
            </Button>
          </>
        )}

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconSettings className="mr-2 h-4 w-4" size={16} />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(columnVisibility).map(([column, visible]) => (
              <DropdownMenuItem
                key={column}
                className="flex items-center gap-2"
                onClick={() => handleColumnToggle(column as keyof ColumnVisibility)}
              >
                <Checkbox checked={visible} />
                <span className="capitalize">{column}</span>
                {visible ? <Eye className="ml-auto h-4 w-4" /> : <EyeOff className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
