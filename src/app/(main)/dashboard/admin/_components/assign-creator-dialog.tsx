"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type UserProfile } from "@/lib/user-management";

const assignCreatorToCoach = (creatorUid: string, coachUid: string) =>
  fetch("/api/admin/assign-creator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorUid, coachUid }),
  }).then((res) => res.json());

interface AssignCreatorDialogProps {
  children: React.ReactNode;
  coaches: UserProfile[];
  unassignedCreators: UserProfile[];
  onAssigned: () => void;
}

export function AssignCreatorDialog({ children, coaches, unassignedCreators, onAssigned }: AssignCreatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [selectedCreator, setSelectedCreator] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoach || !selectedCreator) {
      alert("Please select both a coach and creator");
      return;
    }

    setLoading(true);
    try {
      await assignCreatorToCoach(selectedCreator, selectedCoach);

      // Reset form
      setSelectedCoach("");
      setSelectedCreator("");

      setOpen(false);
      onAssigned();
    } catch (error) {
      console.error("Error assigning creator:", error);
      alert(error instanceof Error ? error.message : "Failed to assign creator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Creator to Coach</DialogTitle>
          <DialogDescription>
            Assign a creator to a coach. The creator will gain access to the coach&apos;s collections.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coach">Select Coach</Label>
            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.uid} value={coach.uid}>
                    {coach.displayName} ({coach.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="creator">Select Creator</Label>
            <Select value={selectedCreator} onValueChange={setSelectedCreator}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a creator" />
              </SelectTrigger>
              <SelectContent>
                {unassignedCreators.map((creator) => (
                  <SelectItem key={creator.uid} value={creator.uid}>
                    {creator.displayName} ({creator.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {unassignedCreators.length === 0 && (
            <div className="text-muted-foreground text-sm">No unassigned creators available</div>
          )}

          {coaches.length === 0 && <div className="text-muted-foreground text-sm">No coaches available</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedCoach || !selectedCreator}>
              {loading ? "Assigning..." : "Assign Creator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
