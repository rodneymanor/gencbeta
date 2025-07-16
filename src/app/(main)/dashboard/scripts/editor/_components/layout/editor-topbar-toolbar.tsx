"use client";

import { useState, useEffect, useCallback } from "react";

import { Download, Save, Mic, RefreshCw, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useVoice, type VoiceType } from "@/contexts/voice-context";

interface EditorTopBarToolbarProps {
  script: string;
  onSave?: () => void;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
}

export function EditorTopBarToolbar({ script, onSave, autoSaveStatus = "idle" }: EditorTopBarToolbarProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { currentVoice, setCurrentVoice, availableVoices } = useVoice();

  const handleSave = useCallback(async () => {
    if (!script.trim()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      } else {
        // Fallback save logic
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      toast.success("Script saved successfully!");
    } catch {
      toast.error("Failed to save script");
    } finally {
      setIsSaving(false);
    }
  }, [script, onSave]);

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleDownload = () => {
    if (!script.trim()) return;

    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Script downloaded!");
  };

  const handleChangeVoice = (voiceType: VoiceType) => {
    setCurrentVoice(voiceType);
    toast.success(`Voice changed to ${voiceType}`);
  };

  const handleRewriteWithVoice = async (voiceType: VoiceType) => {
    if (!script.trim()) return;

    setIsRewriting(true);
    try {
      setCurrentVoice(voiceType);
      // TODO: Implement actual AI rewrite functionality
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Script rewritten with ${voiceType} voice!`);
    } catch {
      toast.error("Failed to rewrite script");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRewriteScript = async () => {
    if (!script.trim()) return;

    setIsRewriting(true);
    try {
      // TODO: Implement actual AI rewrite functionality
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Script rewritten!");
    } catch {
      toast.error("Failed to rewrite script");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-between">
      {/* Empty space on the left */}
      <div></div>

      {/* Auto-save Status and Export Button - moved to far right */}
      <div className="flex items-center gap-[var(--space-3)]">
        <div className="text-muted-foreground flex items-center gap-[var(--space-1)] text-xs">
          {autoSaveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {autoSaveStatus === "saved" && (
            <>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Saved</span>
            </>
          )}
          {autoSaveStatus === "error" && (
            <>
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span>Save failed</span>
            </>
          )}
          {autoSaveStatus === "idle" && <span className="text-muted-foreground">Auto-save enabled</span>}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!script.trim() || isSaving}
          className="h-10 px-[var(--space-3)]"
        >
          {isSaving ? (
            <Loader2 className="mr-[var(--space-1)] h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-[var(--space-1)] h-4 w-4" />
          )}
          Save
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={!script.trim()}
          className="h-10 px-[var(--space-3)]"
        >
          <Download className="mr-[var(--space-1)] h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
