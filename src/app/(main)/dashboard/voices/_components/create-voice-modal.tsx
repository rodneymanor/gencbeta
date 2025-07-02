"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Instagram, Music, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIVoicesClient } from "@/lib/ai-voices-client";
import { VoiceCreationRequest } from "@/types/ai-voices";
import { toast } from "sonner";

interface CreateVoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceCreated: () => void;
  remainingVoices: number;
}

function validateUrl(url: string, platform: "tiktok" | "instagram"): boolean {
  if (!url) return true; // Allow empty for validation styling

  try {
    const urlObj = new URL(url);
    if (platform === "tiktok") {
      return urlObj.hostname.includes("tiktok.com");
    } else {
      return urlObj.hostname.includes("instagram.com");
    }
  } catch {
    return false;
  }
}

async function createVoice(request: VoiceCreationRequest, onSuccess: () => void) {
        await AIVoicesClient.createCustomVoice(request);
  onSuccess();
  toast.success("Custom voice created successfully!");
}

export function CreateVoiceModal({ open, onOpenChange, onVoiceCreated, remainingVoices }: CreateVoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    profileUrl: "",
    platform: "tiktok" as "tiktok" | "instagram",
    voiceName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profileUrl.trim()) {
      toast.error("Please enter a profile URL");
      return;
    }

    if (remainingVoices <= 0) {
      toast.error("Voice limit reached. Cannot create more custom voices.");
      return;
    }

    setIsLoading(true);

    try {
      const request: VoiceCreationRequest = {
        profileUrl: formData.profileUrl.trim(),
        platform: formData.platform,
        voiceName: formData.voiceName.trim() || undefined,
      };

      await createVoice(request, onVoiceCreated);

      // Reset form
      setFormData({
        profileUrl: "",
        platform: "tiktok",
        voiceName: "",
      });
    } catch (error) {
      console.error("Failed to create voice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create voice");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformChange = (platform: string) => {
    setFormData((prev) => ({ ...prev, platform: platform as "tiktok" | "instagram" }));
  };

  const isValidUrl = validateUrl(formData.profileUrl, formData.platform);
  const canCreateVoice = remainingVoices > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create AI Voice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Voice Limit Warning */}
          {remainingVoices <= 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You&apos;ve reached your voice limit. Delete an existing voice or upgrade your plan to create more.
              </AlertDescription>
            </Alert>
          )}

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>Select Platform</Label>
            <RadioGroup
              value={formData.platform}
              onValueChange={handlePlatformChange}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="tiktok" id="tiktok" className="peer sr-only" />
                <Label
                  htmlFor="tiktok"
                  className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4"
                >
                  <Music className="mb-3 h-6 w-6" />
                  TikTok
                </Label>
              </div>
              <div>
                <RadioGroupItem value="instagram" id="instagram" className="peer sr-only" />
                <Label
                  htmlFor="instagram"
                  className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4"
                >
                  <Instagram className="mb-3 h-6 w-6" />
                  Instagram
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Profile URL Input */}
          <div className="space-y-2">
            <Label htmlFor="profileUrl">{formData.platform === "tiktok" ? "TikTok" : "Instagram"} Profile URL</Label>
            <Input
              id="profileUrl"
              type="url"
              placeholder={
                formData.platform === "tiktok"
                  ? "https://www.tiktok.com/@username"
                  : "https://www.instagram.com/username"
              }
              value={formData.profileUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, profileUrl: e.target.value }))}
              className={!isValidUrl ? "border-destructive" : ""}
              required
            />
            {formData.profileUrl && !isValidUrl && (
              <p className="text-destructive text-sm">
                Please enter a valid {formData.platform === "tiktok" ? "TikTok" : "Instagram"} profile URL
              </p>
            )}
          </div>

          {/* Custom Voice Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="voiceName">Custom Voice Name (Optional)</Label>
            <Input
              id="voiceName"
              placeholder="e.g., My Business Voice"
              value={formData.voiceName}
              onChange={(e) => setFormData((prev) => ({ ...prev, voiceName: e.target.value }))}
            />
            <p className="text-muted-foreground text-xs">
              Leave blank to auto-generate based on the creator&apos;s name
            </p>
          </div>

          {/* Info Card */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">How it works:</h4>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• We&apos;ll analyze the creator&apos;s content style and tone</li>
                  <li>• Generate 100+ templates based on their approach</li>
                  <li>• Create a voice that matches their communication style</li>
                  <li>• Process typically takes 2-3 minutes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.profileUrl || !isValidUrl || !canCreateVoice}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Voice..." : "Create AI Voice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
