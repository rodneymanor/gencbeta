"use client";

import { useState } from "react";

import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableLoading } from "@/components/ui/loading-animations";
import { ScriptsCryptoTable, type ScriptCryptoData } from "@/components/ui/scripts-crypto-table";
import { useScripts } from "@/hooks/use-scripts";
import { Script } from "@/types/script";

import { ScriptsControls } from "./_components/scripts-controls";

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
  const sortMap: Record<string, string | number> = {
    title: script.title,
    authors: script.authors,
    added: new Date(script.createdAt).getTime(),
    viewed: new Date(script.viewedAt).getTime(),
    fileType: script.fileType,
  };

  return sortMap[sortBy] ?? script.title;
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

  const handleTitleEdit = async (scriptId: string, newTitle: string) => {
    // For now, just show a success message since we don't have an update script function
    // In a real implementation, this would call an API to update the script title
    toast.success("Script title updated");
    console.log(`Update script ${scriptId} title to: ${newTitle}`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-[var(--space-4)] p-[var(--space-3)]">
        <TableLoading />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-[var(--space-4)] p-[var(--space-3)]">
        <Card className="bg-destructive/5">
          <CardContent className="p-[var(--space-3)]">
            <div className="text-center">
              <h3 className="text-destructive text-base font-medium">Failed to load scripts</h3>
              <p className="text-muted-foreground mt-[var(--space-1)] text-sm">
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-[var(--space-4)] p-[var(--space-3)]">
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
        <Card className="bg-primary/5">
          <CardContent className="p-[var(--space-2)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedScripts.length} script{selectedScripts.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-[var(--space-1)]">
                <Button variant="outline" size="sm">
                  <Download className="mr-[var(--space-1)] h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-[var(--space-1)] h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scripts Table */}
      <ScriptsCryptoTable
        data={sortedScripts}
        selectedScripts={selectedScripts}
        onRowClick={(script) => window.open(`/dashboard/scripts/editor?scriptId=${script.id}`, "_blank")}
        onTitleEdit={handleTitleEdit}
        onView={(scriptId) => window.open(`/dashboard/scripts/editor?scriptId=${scriptId}`, "_blank")}
        onEdit={(scriptId) => window.open(`/dashboard/scripts/editor?scriptId=${scriptId}`, "_blank")}
        onDuplicate={(scriptId) => {
          toast.info("Duplicate feature coming soon");
        }}
        onDelete={(scriptId) => {
          const script = sortedScripts.find((s) => s.id === scriptId);
          if (script) {
            handleSelectScript(scriptId);
            handleDeleteSelected();
          }
        }}
      />
    </div>
  );
}
