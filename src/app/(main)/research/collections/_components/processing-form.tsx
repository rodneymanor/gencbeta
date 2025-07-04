"use client";

import { Plus, AlertTriangle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { RateLimitResult } from "@/types/video-processing";

interface Collection {
  id: string;
  title: string;
}

interface ProcessingFormProps {
  url: string;
  setUrl: (url: string) => void;
  title: string;
  setTitle: (title: string) => void;
  collectionId: string;
  setCollectionId: (id: string) => void;
  collections: Collection[];
  error: string | null;
  rateLimitInfo: RateLimitResult | null;
  getRateLimitMessage: (info: RateLimitResult) => string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function ProcessingForm({
  url,
  setUrl,
  title,
  setTitle,
  collectionId,
  setCollectionId,
  collections,
  error,
  rateLimitInfo,
  getRateLimitMessage,
  isLoading,
  onSubmit,
  onCancel,
}: ProcessingFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 pt-2">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="py-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Rate Limit Warning */}
      {rateLimitInfo && !rateLimitInfo.allowed && (
        <Alert className="border-[#2d93ad]/20 bg-[#2d93ad]/10 py-3">
          <Clock className="h-4 w-4 text-[#2d93ad]" />
          <AlertDescription className="text-sm text-[#2d93ad]">{getRateLimitMessage(rateLimitInfo)}</AlertDescription>
        </Alert>
      )}

      {/* Rate Limit Info */}
      {rateLimitInfo && rateLimitInfo.allowed && rateLimitInfo.remaining < 5 && (
        <Alert className="border-yellow-200 bg-yellow-50 py-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800">
            You have {rateLimitInfo.remaining} video{rateLimitInfo.remaining !== 1 ? "s" : ""} remaining in this time
            window.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="video-url" className="text-sm font-medium">
          Video URL
        </Label>
        <Input
          id="video-url"
          type="url"
          placeholder="https://www.tiktok.com/@username/video/123..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="border-border/60 focus:border-border bg-background shadow-xs transition-all duration-200 focus:shadow-sm"
        />
        <div className="text-muted-foreground flex gap-2 text-xs">
          <Badge variant="outline" className="text-xs">
            TikTok
          </Badge>
          <Badge variant="outline" className="text-xs">
            Instagram
          </Badge>
          <span>supported platforms</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-title" className="text-sm font-medium">
          Title (Optional)
        </Label>
        <Input
          id="video-title"
          type="text"
          placeholder="Custom title for this video..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-border/60 focus:border-border bg-background shadow-xs transition-all duration-200 focus:shadow-sm"
        />
        <div className="text-muted-foreground text-xs">Leave empty to auto-generate from video content</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="collection-select" className="text-sm font-medium">
          Collection
        </Label>
        <Select value={collectionId} onValueChange={setCollectionId} required>
          <SelectTrigger
            id="collection-select"
            className="border-border/60 focus:border-border bg-background shadow-xs transition-all duration-200 focus:shadow-sm"
          >
            <SelectValue placeholder="Select a collection" />
          </SelectTrigger>
          <SelectContent className="border-border/60 shadow-lg">
            {collections.map((collection) => (
              <SelectItem
                key={collection.id}
                value={collection.id}
                className="hover:bg-secondary/60 focus:bg-secondary/60 cursor-pointer"
              >
                {collection.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!url.trim() || !collectionId || isLoading || rateLimitInfo?.allowed === false}
          className="min-w-[120px] shadow-xs transition-all duration-200 hover:shadow-sm"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Queueing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Video
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
