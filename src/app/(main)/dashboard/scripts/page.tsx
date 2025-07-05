"use client";

import { useState } from "react";

import { Download, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MinimalCard, MinimalCardHeader, MinimalCardTitle, MinimalCardContent } from "@/components/ui/minimal-card";
import { TableLoading } from "@/components/ui/loading-animations";
import { useScripts } from "@/hooks/use-scripts";

export default function ScriptsLibraryPage() {
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);

  const { scripts, isLoading, error } = useScripts();

  const handleSelectScript = (scriptId: string) => {
    setSelectedScripts((prev) =>
      prev.includes(scriptId) ? prev.filter((id) => id !== scriptId) : [...prev, scriptId]
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="section">
        <TableLoading />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="section">
        <MinimalCard>
          <MinimalCardHeader>
            <MinimalCardTitle level={3}>Failed to load scripts</MinimalCardTitle>
          </MinimalCardHeader>
          <MinimalCardContent>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
          </MinimalCardContent>
        </MinimalCard>
      </div>
    );
  }

  return (
    <div className="section">
      {/* Header */}
      <MinimalCard spacing="tight">
        <MinimalCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <MinimalCardTitle level={1}>Scripts Library</MinimalCardTitle>
              <p className="text-muted-foreground mt-2">
                Manage and organize your script collection
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Script
            </Button>
          </div>
        </MinimalCardHeader>
      </MinimalCard>

      {/* Bulk Actions */}
      {selectedScripts.length > 0 && (
        <MinimalCard spacing="tight">
          <MinimalCardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedScripts.length} script{selectedScripts.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </MinimalCardContent>
        </MinimalCard>
      )}

      {/* Scripts List */}
      <div className="space-y-0">
        {scripts.map((script) => (
          <MinimalCard key={script.id} spacing="tight">
            <MinimalCardContent>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedScripts.includes(script.id)}
                      onChange={() => handleSelectScript(script.id)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <h3 className="font-medium">{script.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {script.authors} • {script.duration} • {new Date(script.added).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {script.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {script.summary && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {script.summary}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  •••
                </Button>
              </div>
            </MinimalCardContent>
          </MinimalCard>
        ))}
      </div>

      {scripts.length === 0 && (
        <MinimalCard>
          <MinimalCardContent>
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No scripts found</h3>
              <p className="text-muted-foreground mt-2">
                Get started by creating your first script
              </p>
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Script
              </Button>
            </div>
          </MinimalCardContent>
        </MinimalCard>
      )}
    </div>
  );
}
