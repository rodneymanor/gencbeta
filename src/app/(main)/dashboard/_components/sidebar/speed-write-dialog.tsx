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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SpeedWriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpeedWriteDialog({ open, onOpenChange }: SpeedWriteDialogProps) {
  const [scriptIdea, setScriptIdea] = useState("");

  const handleSubmit = () => {
    console.log("Script Idea:", scriptIdea);
    // Add logic to handle script submission, e.g., redirect to editor
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>What would you like to write today?</DialogTitle>
          <DialogDescription>Create engaging scripts that will grow your audience.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            id="script-idea"
            placeholder="Enter a script idea to get started..."
            value={scriptIdea}
            onChange={(e) => setScriptIdea(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={!scriptIdea.trim()}>
            <Zap className="mr-2 h-4 w-4" />
            Start Writing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
