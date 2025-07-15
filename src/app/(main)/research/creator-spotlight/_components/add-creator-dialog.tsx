"use client";

import React, { useState } from "react";

import { Plus, Loader2, Check, AlertCircle, ChevronDown, HelpCircle } from "lucide-react";

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
import { cn } from "@/lib/utils";

interface AddCreatorDialogProps {
  children: React.ReactNode;
  onCreatorAdded: () => void;
}

interface CreatorFormData {
  username: string;
  platform: "tiktok" | "instagram";
}

interface ExpandableHelpProps {
  title: string;
  children: React.ReactNode;
}

function ExpandableHelp({ title, children }: ExpandableHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-[var(--space-1)]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary md:hover:text-primary/90 flex items-center gap-[var(--space-1)] text-sm font-normal transition-colors duration-200"
      >
        <HelpCircle className="h-3 w-3" />
        <span>{title}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="bg-muted border-border mt-2 rounded-lg border p-3 opacity-100 transition-all duration-200">
          {children}
        </div>
      )}
    </div>
  );
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
      <DialogContent className="mx-4 max-w-[500px] md:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Creator
          </DialogTitle>
          <DialogDescription>
            Enter a creator&apos;s username or paste their profile URL to add them to the spotlight.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-[var(--space-3)]">
          {/* Username/URL Input */}
          <div className="space-y-[var(--space-1)]">
            <label htmlFor="username" className="text-muted-foreground text-sm font-normal">
              Username or Profile URL *<span className="ml-1">(paste username or full profile URL)</span>
            </label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-0 -translate-y-1/2 transform">@</span>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="username or https://tiktok.com/@username"
                required
                disabled={loading}
                className="text-foreground border-border focus:border-primary focus:ring-ring disabled:border-muted disabled:text-muted-foreground placeholder:text-muted-foreground h-12 w-full border-0 border-b-2 bg-transparent pr-0 pl-6 text-base transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-muted-foreground text-sm font-normal">
              You can paste a full profile URL and we&apos;ll automatically detect the platform and extract the
              username.
            </p>

            <ExpandableHelp title="Supported URL formats">
              <div className="text-muted-foreground space-y-2 text-sm font-normal">
                <p className="font-medium">TikTok:</p>
                <ul className="ml-2 list-inside list-disc space-y-1">
                  <li>https://tiktok.com/@username</li>
                  <li>https://www.tiktok.com/@username</li>
                  <li>tiktok.com/@username</li>
                </ul>
                <p className="mt-3 font-medium">Instagram:</p>
                <ul className="ml-2 list-inside list-disc space-y-1">
                  <li>https://instagram.com/username</li>
                  <li>https://www.instagram.com/username</li>
                  <li>instagram.com/username</li>
                </ul>
                <p className="text-primary mt-3 text-sm font-normal">
                  💡 Tip: Just paste the full URL and we&apos;ll handle the rest!
                </p>
              </div>
            </ExpandableHelp>
          </div>

          {/* Platform Selection */}
          <div className="space-y-[var(--space-1)]">
            <label htmlFor="platform" className="text-muted-foreground text-sm font-normal">
              Platform *
            </label>
            <div className="relative">
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => handleInputChange("platform", e.target.value as "tiktok" | "instagram")}
                required
                disabled={loading}
                className="text-foreground border-border focus:border-primary focus:ring-ring disabled:border-muted disabled:text-muted-foreground h-12 w-full cursor-pointer appearance-none border-0 border-b-2 bg-transparent px-0 pr-8 text-base transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed"
              >
                <option value="">Select platform</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="instagram">📸 Instagram</option>
              </select>
              <ChevronDown className="text-muted-foreground pointer-events-none absolute top-4 right-0 h-5 w-5" />
            </div>

            <ExpandableHelp title="Why do we need the platform?">
              <div className="text-muted-foreground space-y-2 text-sm font-normal">
                <p>
                  Different platforms have unique content formats, engagement patterns, and analytics. Knowing the
                  platform helps us:
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1">
                  <li>Optimize content downloading and processing</li>
                  <li>Apply platform-specific analysis algorithms</li>
                  <li>Provide accurate performance insights</li>
                  <li>Enable platform-native features and integrations</li>
                </ul>
                <p className="text-primary mt-2 text-sm font-normal">
                  💡 If you paste a URL, we&apos;ll auto-detect the platform for you!
                </p>
              </div>
            </ExpandableHelp>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-muted space-y-2 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="text-destructive h-4 w-4" />
                <p className="text-destructive text-sm font-normal">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-muted space-y-2 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <Check className="text-foreground h-4 w-4" />
                <p className="text-foreground text-sm font-normal">✓ {success}</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {formData.username && (
            <div className="bg-muted space-y-2 rounded-xl p-6">
              <h4 className="text-foreground mb-2 text-base font-medium">Preview</h4>

              {/* Header with Avatar */}
              <div className="flex items-center space-x-3">
                <div className="bg-muted text-foreground flex h-10 w-10 items-center justify-center rounded-full font-medium">
                  {formData.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-foreground text-base font-medium">{formData.displayName ?? formData.username}</h3>
                  <p className="text-muted-foreground text-sm font-normal">@{formData.username}</p>
                </div>
              </div>

              {/* Body */}
              {formData.bio && <p className="text-foreground text-sm leading-normal font-normal">{formData.bio}</p>}

              {/* Metadata */}
              <div className="text-muted-foreground text-sm font-normal">Platform: {formData.platform}</div>
            </div>
          )}

          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-muted-foreground md:hover:text-foreground focus:ring-ring disabled:text-muted-foreground order-2 w-full text-sm font-normal transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed md:order-1 md:w-auto"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading || !formData.username || !formData.platform}
              className="bg-primary text-primary-foreground md:hover:bg-primary/90 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground order-1 flex w-full items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:cursor-wait md:order-2 md:w-auto"
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
