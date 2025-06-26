"use client";

import { useState } from "react";

import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { ScriptsControls } from "./_components/scripts-controls";
import { ScriptsTable } from "./_components/scripts-table";

interface Script {
  id: number;
  title: string;
  authors: string;
  status: string;
  performance: { views: number; engagement: number };
  category: string;
  createdAt: string;
  viewedAt: string;
  duration: string;
  tags: string[];
  fileType: string;
  summary: string;
}

interface ColumnVisibility {
  title: boolean;
  authors: boolean;
  added: boolean;
  viewed: boolean;
  fileType: boolean;
  summary: boolean;
}

// Mock data for scripts
const mockScripts: Script[] = [
  {
    id: 1,
    title: "Morning Routine Success",
    authors: "John Doe",
    status: "Published",
    performance: { views: 12500, engagement: 8.2 },
    category: "Lifestyle",
    createdAt: "2024-01-15",
    viewedAt: "2024-01-20",
    duration: "2:34",
    tags: ["morning", "productivity"],
    fileType: "Script",
    summary: "Complete morning routine guide for productivity",
  },
  {
    id: 2,
    title: "Tech Product Review Template",
    authors: "Jane Smith",
    status: "Draft",
    performance: { views: 0, engagement: 0 },
    category: "Technology",
    createdAt: "2024-01-20",
    viewedAt: "2024-01-22",
    duration: "3:45",
    tags: ["tech", "review"],
    fileType: "Template",
    summary: "Comprehensive tech review framework",
  },
  {
    id: 3,
    title: "Quick Cooking Tutorial",
    authors: "Mike Johnson",
    status: "Scheduled",
    performance: { views: 0, engagement: 0 },
    category: "Food",
    createdAt: "2024-01-18",
    viewedAt: "2024-01-19",
    duration: "1:56",
    tags: ["cooking", "tutorial"],
    fileType: "Script",
    summary: "Fast and easy cooking techniques",
  },
];

// Helper functions
const getSortValue = (script: Script, sortBy: string): string | number => {
  switch (sortBy) {
    case "title":
      return script.title;
    case "authors":
      return script.authors;
    case "added":
      return new Date(script.createdAt).getTime();
    case "viewed":
      return new Date(script.viewedAt).getTime();
    case "fileType":
      return script.fileType;
    default:
      return script.title;
  }
};

const sortScripts = (scripts: Script[], sortBy: string, sortOrder: "asc" | "desc"): Script[] => {
  return [...scripts].sort((a, b) => {
    const aValue = getSortValue(a, sortBy);
    const bValue = getSortValue(b, sortBy);

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });
};

export default function ScriptsLibraryPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedScripts, setSelectedScripts] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    title: true,
    authors: true,
    added: true,
    viewed: true,
    fileType: true,
    summary: true,
  });

  const filteredScripts = mockScripts.filter((script) => {
    return statusFilter === "all" || script.status.toLowerCase() === statusFilter;
  });

  const sortedScripts = sortScripts(filteredScripts, sortBy, sortOrder);

  const handleSelectScript = (scriptId: number) => {
    setSelectedScripts((prev) =>
      prev.includes(scriptId) ? prev.filter((id) => id !== scriptId) : [...prev, scriptId],
    );
  };

  const handleSelectAll = () => {
    if (selectedScripts.length === sortedScripts.length) {
      setSelectedScripts([]);
    } else {
      setSelectedScripts(sortedScripts.map((script) => script.id));
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => {
      const newVisibility = { ...prev };
      newVisibility[column] = !newVisibility[column];
      return newVisibility;
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header with Controls */}
      <ScriptsControls
        statusFilter={statusFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        columnVisibility={columnVisibility}
        onStatusFilterChange={setStatusFilter}
        onSort={handleSort}
        onToggleColumnVisibility={toggleColumnVisibility}
      />

      {/* Bulk Actions */}
      {selectedScripts.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedScripts.length} script{selectedScripts.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scripts Table */}
      <ScriptsTable
        scripts={sortedScripts}
        selectedScripts={selectedScripts}
        columnVisibility={columnVisibility}
        sortBy={sortBy}
        onSelectScript={handleSelectScript}
        onSelectAll={handleSelectAll}
        onSort={handleSort}
      />
    </div>
  );
}
