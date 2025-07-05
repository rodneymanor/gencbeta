"use client";

import { useState } from "react";
import { 
  FileText, 
  Save, 
  Settings, 
  Eye,
  Palette,
  BarChart3,
  MoreHorizontal,
  Download,
  Upload,
  RotateCcw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MinimalEditorToolbarProps {
  title?: string;
  status?: "draft" | "editing" | "ready";
  readabilityLevel?: "easy" | "medium" | "hard";
  onSave?: () => void;
  onToggleReadability?: () => void;
  onToggleHighlights?: () => void;
  onToggleSettings?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onReset?: () => void;
  children?: React.ReactNode;
}

export function MinimalEditorToolbar({
  title = "Script Editor",
  status = "draft",
  readabilityLevel,
  onSave,
  onToggleReadability,
  onToggleHighlights,
  onToggleSettings,
  onExport,
  onImport,
  onReset,
  children
}: MinimalEditorToolbarProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800";
      case "editing": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getReadabilityColor = (level?: string) => {
    switch (level) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="center-column">
      <div className="flex items-center justify-between py-4 border-b border-border/10">
        {/* Left: Title and Status */}
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-medium">{title}</h1>
          <Badge variant="secondary" className={getStatusColor(status)}>
            {status}
          </Badge>
          {readabilityLevel && (
            <Badge variant="outline" className={getReadabilityColor(readabilityLevel)}>
              {readabilityLevel} reading
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleReadability}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analysis</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHighlights}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Highlights</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSettings}
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Style</span>
          </Button>

          {/* More Actions Menu */}
          <DropdownMenu open={isActionsOpen} onOpenChange={setIsActionsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImport} className="gap-2">
                <Upload className="h-4 w-4" />
                Import Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleSettings} className="gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onReset} className="gap-2 text-destructive">
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save Button */}
          <Button
            onClick={onSave}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          {/* Custom Actions */}
          {children}
        </div>
      </div>
    </div>
  );
} 