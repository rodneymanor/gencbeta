"use client";

import { useState } from "react";

import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppState } from "@/contexts/app-state-context";

interface SpeedWriteDialogProps {
  children: React.ReactNode;
}

export function SpeedWriteDialog({ children }: SpeedWriteDialogProps) {
  const [scriptIdea, setScriptIdea] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { setScriptCreating } = useAppState();

  const handleScriptCreation = async () => {
    if (!scriptIdea.trim()) return;

    setIsCreating(true);
    setScriptCreating(true);
    console.log("Creating script from idea:", scriptIdea);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsCreating(false);
    setScriptCreating(false);
    setScriptIdea("");

    // TODO: Navigate to script creation or handle the script creation logic
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleScriptCreation();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">What would you like to write today?</DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Create engaging scripts that will grow your audience.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="script-idea" className="text-sm font-medium">
              Script Idea
            </Label>
            <Input
              id="script-idea"
              placeholder="Describe your script idea..."
              value={scriptIdea}
              onChange={(e) => setScriptIdea(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[44px]"
            />
          </div>
          <Button
            onClick={handleScriptCreation}
            disabled={!scriptIdea.trim() || isCreating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            {isCreating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "Start Writing"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
