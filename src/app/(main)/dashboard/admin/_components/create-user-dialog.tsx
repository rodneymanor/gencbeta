"use client";

import { useState } from "react";

import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type UserRole } from "@/lib/user-management";

interface CreateUserDialogProps {
  children: React.ReactNode;
  onUserCreated: () => void;
}

// Helper function to create user via API
async function createUserViaAPI(userData: {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  coachId?: string;
}) {
  const response = await fetch("/api/debug-env", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "complete-user-creation",
      userData: {
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        role: userData.role,
        coachId: userData.role === "creator" ? userData.coachId : undefined,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.details ?? result.error ?? "Failed to create user");
  }

  return result;
}

export function CreateUserDialog({ children, onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    // Default to "coach" since this is typically used by admins to create coach accounts
    // Change to "creator" if creating content creators
    role: "coach" as UserRole,
    coachId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.displayName) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔍 [CREATE_USER] Creating user with complete account approach");

      // Use server-side atomic user creation
      const result = await createUserViaAPI(formData);

      console.log("✅ [CREATE_USER] User created successfully:", result);

      // Reset form
      setFormData({
        email: "",
        password: "",
        displayName: "",
        role: "coach",
        coachId: "",
      });

      // Close dialog and refresh data
      setOpen(false);
      onUserCreated();

      // Show success message
      toast.success(`User ${formData.displayName} created successfully with role: ${formData.role}`);
    } catch (error) {
      console.error("❌ [CREATE_USER] Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new coach or creator account. The user will receive login credentials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "creator" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coachId" className="text-right">
                  Assign to Coach
                </Label>
                <Input
                  id="coachId"
                  value={formData.coachId}
                  onChange={(e) => setFormData({ ...formData, coachId: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter coach UID (optional)"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
