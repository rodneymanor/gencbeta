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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

interface CreateCreatorDialogProps {
  children: React.ReactNode;
  onCreatorCreated: () => void;
}

export function CreateCreatorDialog({ children, onCreatorCreated }: CreateCreatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  const { signUp, user, userProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.displayName) {
      alert("Please fill in all fields");
      return;
    }

    if (!user || !userProfile) {
      alert("You must be logged in to create creators");
      return;
    }

    if (userProfile.role !== "coach") {
      alert("Only coaches can create creator accounts");
      return;
    }

    setLoading(true);
    try {
      // Create the creator account and automatically assign to this coach
      await signUp(formData.email, formData.password, formData.displayName, "creator", userProfile.uid);

      // Reset form
      setFormData({
        email: "",
        password: "",
        displayName: "",
      });

      setOpen(false);
      onCreatorCreated();
    } catch (error) {
      console.error("Error creating creator:", error);
      alert(error instanceof Error ? error.message : "Failed to create creator");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Creator</DialogTitle>
          <DialogDescription>
            Create a new creator account. The creator will be automatically assigned to you and can access your
            collections.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="creator@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={(e) => handleInputChange("displayName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              minLength={6}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Creator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
