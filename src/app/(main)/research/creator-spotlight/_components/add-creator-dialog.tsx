"use client";

import React, { useState } from "react";

import { Plus, Loader2, Check, AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

interface AddCreatorDialogProps {
  children: React.ReactNode;
  onCreatorAdded: () => void;
}

interface CreatorFormData {
  username: string;
  platform: "tiktok" | "instagram";
}

export function AddCreatorDialog({ children, onCreatorAdded }: AddCreatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatorFormData>({
    username: "",
    platform: "tiktok",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submitCreator = async () => {
    const response = await fetch("/api/creators", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success) {
      setSuccess(data.message);
      resetForm();
      setTimeout(() => {
        setOpen(false);
        onCreatorAdded();
      }, 2000);
    } else {
      setError(data.error ?? "Failed to add creator");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.platform) {
      setError("Username and platform are required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await submitCreator();
    } catch (error) {
      console.error("Error adding creator:", error);
      if (error instanceof Error && error.message.includes("401")) {
        setError("Authentication required. Please log in to add creators.");
      } else {
        setError("Failed to add creator. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      platform: "tiktok",
    });
  };

  const detectPlatformFromUrl = (url: string): "tiktok" | "instagram" | null => {
    if (url.includes("tiktok.com") || url.includes("tiktok")) {
      return "tiktok";
    }
    if (url.includes("instagram.com") || url.includes("instagram")) {
      return "instagram";
    }
    return null;
  };

  const extractUsernameFromUrl = (url: string): string => {
    // Remove protocol and domain
    let username = url.replace(/^https?:\/\//, "");
    username = username.replace(/^www\./, "");

    // Extract username from various URL patterns
    const patterns = [/(?:tiktok\.com|instagram\.com)\/@?([^/?]+)/, /(?:tiktok\.com|instagram\.com)\/([^/?]+)/];

    for (const pattern of patterns) {
      const match = username.match(pattern);
      if (match) {
        return match[1].replace("@", "");
      }
    }

    return username;
  };

  const handleInputChange = (field: keyof CreatorFormData, value: string) => {
    if (field === "username") {
      // Check if input looks like a URL
      if (value.includes("http") || value.includes("tiktok.com") || value.includes("instagram.com")) {
        const detectedPlatform = detectPlatformFromUrl(value);
        const extractedUsername = extractUsernameFromUrl(value);

        setFormData((prev) => ({
          ...prev,
          username: extractedUsername,
          platform: detectedPlatform ?? prev.platform,
        }));
      } else {
        // Regular username input
        setFormData((prev) => ({
          ...prev,
          username: value.replace("@", ""),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Creator
          </DialogTitle>
          <DialogDescription>
            Enter a creator&apos;s username or paste their profile URL to add them to the spotlight.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username/URL Input */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username or Profile URL *
              <span className="text-muted-foreground ml-1">(paste username or full profile URL)</span>
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transform">@</span>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="username or https://tiktok.com/@username"
                className="pl-8"
                required
              />
            </div>
            <p className="text-muted-foreground text-xs">
              You can paste a full profile URL and we&apos;ll automatically detect the platform and extract the
              username.
            </p>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={formData.platform}
              onValueChange={(value: "tiktok" | "instagram") => handleInputChange("platform", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎵</span>
                    <span>TikTok</span>
                    <Badge variant="outline" className="ml-auto border-[#FF0050] bg-[#FF0050] text-white">
                      TikTok
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="instagram">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📸</span>
                    <span>Instagram</span>
                    <Badge variant="outline" className="ml-auto border-[#E4405F] bg-[#E4405F] text-white">
                      Instagram
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {formData.username && (
            <div className="bg-muted/50 rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Preview</h4>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white"
                    style={{
                      backgroundColor: formData.platform === "tiktok" ? "#FF0050" : "#E4405F",
                    }}
                  >
                    {formData.username.charAt(0).toUpperCase()}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute -right-1 -bottom-1 text-xs capitalize",
                      formData.platform === "tiktok" && "border-[#FF0050] bg-[#FF0050] text-white",
                      formData.platform === "instagram" && "border-[#E4405F] bg-[#E4405F] text-white",
                    )}
                  >
                    {formData.platform}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">{formData.displayName ?? formData.username}</p>
                  <p className="text-muted-foreground text-sm">@{formData.username}</p>
                  {formData.bio && <p className="text-muted-foreground mt-1 text-sm">{formData.bio}</p>}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.username || !formData.platform}
              className={cn(
                "flex items-center gap-2",
                formData.platform === "tiktok" && "bg-[#FF0050] hover:bg-[#E6004C]",
                formData.platform === "instagram" && "bg-[#E4405F] hover:bg-[#D6336C]",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Creator
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
