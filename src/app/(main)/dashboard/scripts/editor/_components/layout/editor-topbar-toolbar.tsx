"use client";

import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface EditorTopBarToolbarProps {
  script: string;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
}

export function EditorTopBarToolbar({ script, autoSaveStatus = "idle" }: EditorTopBarToolbarProps) {
  return (
    <div className="flex w-full items-center justify-between">
      {/* Empty space on the left */}
      <div></div>

      {/* Auto-save Status and Export Button - moved to far right */}
      <div className="flex items-center gap-[var(--space-3)]">
        {/* Auto-save Status Badge */}
        {autoSaveStatus === "saving" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </Badge>
        )}
        {autoSaveStatus === "saved" && (
          <Badge
            variant="default"
            className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
          >
            <CheckCircle className="h-3 w-3" />
            Saved
          </Badge>
        )}
        {autoSaveStatus === "error" && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Save failed
          </Badge>
        )}
        {autoSaveStatus === "idle" && (
          <span className="focus-visible:border-ring focus-visible:ring-ring/50 border-primary/20 text-primary bg-primary/10 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg border px-2 py-1 text-xs font-normal whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px]">
            <CheckCircle className="h-2.5 w-2.5" />
            Auto-save enabled
          </span>
        )}
      </div>
    </div>
  );
}
