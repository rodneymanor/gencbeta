"use client";

import { useState, useEffect } from "react";
import { Download, Save, Mic, RefreshCw, Sparkles, Settings, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface FloatingToolbarProps {
  script: string;
  onScriptChange: (script: string) => void;
}

export function FloatingToolbar({ script, onScriptChange }: FloatingToolbarProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!script.trim()) return;
    
    setIsSaving(true);
    try {
      // TODO: Implement actual save functionality
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Script saved successfully!");
    } catch (error) {
      toast.error("Failed to save script");
    } finally {
      setIsSaving(false);
    }
  };

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [script]);

  const handleDownload = () => {
    if (!script.trim()) return;
    
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Script downloaded!");
  };

  const handleRewriteWithVoice = async (voiceType: string) => {
    if (!script.trim()) return;
    
    setIsRewriting(true);
    try {
      // TODO: Implement actual AI rewrite functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast.success(`Script rewritten with ${voiceType} voice!`);
    } catch (error) {
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
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast.success("Script rewritten!");
    } catch (error) {
      toast.error("Failed to rewrite script");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <Card className="bg-background/95 border shadow-lg backdrop-blur-sm">
        <CardContent className="p-2">
          <div className="flex items-center gap-1">
            {/* Save Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !script.trim()}
              className="h-8 px-3"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>

            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={!script.trim()}
              className="h-8 px-3"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Voice Rewrite Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isRewriting || !script.trim()}
                  className="h-8 px-3"
                >
                  <Mic className="h-4 w-4 mr-1" />
                  Voice
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Professional")}>
                  <Mic className="h-4 w-4 mr-2" />
                  Professional Voice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Casual")}>
                  <Mic className="h-4 w-4 mr-2" />
                  Casual Voice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Friendly")}>
                  <Mic className="h-4 w-4 mr-2" />
                  Friendly Voice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Authoritative")}>
                  <Mic className="h-4 w-4 mr-2" />
                  Authoritative Voice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isRewriting || !script.trim()}
                  className="h-8 px-3"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRewriteScript}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rewrite Script
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Hook")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve Hook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("CTA")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Strengthen CTA
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Flow")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve Flow
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Keyboard Shortcuts Indicator */}
            <div className="flex items-center gap-1 ml-2 text-xs text-muted-foreground">
              <kbd className="bg-muted rounded px-1.5 py-0.5">⌘S</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 