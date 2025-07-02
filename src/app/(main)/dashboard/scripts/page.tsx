"use client";

import { useState } from "react";

import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableLoading } from "@/components/ui/loading-animations";

import { useScripts } from "@/hooks/use-scripts";
import { Script } from "@/types/script";

import { ScriptsControls } from "./_components/scripts-controls";
import { ScriptsTable } from "./_components/scripts-table";

interface ColumnVisibility {
  title: boolean;
  authors: boolean;
  added: boolean;
  viewed: boolean;
  fileType: boolean;
  summary: boolean;
}



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
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
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

  // Fetch scripts using the custom hook
  const { scripts, isLoading, error, deleteScript, isDeleting } = useScripts();

  const filteredScripts = scripts.filter((script) => {
    return statusFilter === "all" || script.status.toLowerCase() === statusFilter;
  });

  const sortedScripts = sortScripts(filteredScripts, sortBy, sortOrder);

  const handleSelectScript = (scriptId: string) => {
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

  const handleDeleteSelected = async () => {
    if (selectedScripts.length === 0) return;
    
    const deletePromises = selectedScripts.map((scriptId) => deleteScript(scriptId));
    await Promise.all(deletePromises);
    setSelectedScripts([]);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <TableLoading />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive">Failed to load scripts</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
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
