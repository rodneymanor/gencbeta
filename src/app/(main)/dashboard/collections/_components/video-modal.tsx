"use client";

import { useEffect, useState } from "react";

import { Calendar, Eye, Heart, MessageCircle, Share, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Video } from "@/lib/collections";

interface VideoModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  const [embedLoaded, setEmbedLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && video) {
      setEmbedLoaded(false);
      // Reset embed state when modal opens
    }
  }, [isOpen, video]);

  if (!video) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTikTokEmbedUrl = (url: string): string => {
    // Extract video ID from TikTok URL
    const match = url.match(/\/video\/(\d+)/);
    if (match) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    return url;
  };

  const isInstagramReel = (url: string): boolean => {
    return url.includes("instagram.com/reel");
  };

  const getInstagramEmbedUrl = (url: string): string => {
    return `${url}embed/`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Video Section */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>

            {video.platform === "tiktok" ? (
              <iframe
                src={getTikTokEmbedUrl(video.url)}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="encrypted-media"
                className="min-h-[500px]"
                onLoad={() => setEmbedLoaded(true)}
              />
            ) : isInstagramReel(video.url) ? (
              <iframe
                src={getInstagramEmbedUrl(video.url)}
                width="400"
                height="600"
                frameBorder="0"
                scrolling="no"
                allowTransparency
                onLoad={() => setEmbedLoaded(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Video Preview</h3>
                  <p className="text-white/70 mb-4">
                    Direct embedding not available for this video
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(video.url, "_blank")}
                    className="text-white border-white hover:bg-white hover:text-black"
                  >
                    Open in {video.platform.charAt(0).toUpperCase() + video.platform.slice(1)}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="w-96 bg-background border-l overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {video.platform}
                  </Badge>
                  {video.duration && (
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold leading-tight">{video.title}</h2>
                {video.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                    {video.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Author */}
              {video.author && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{video.author}</p>
                    <p className="text-sm text-muted-foreground">Creator</p>
                  </div>
                </div>
              )}

              {/* Stats */}
              {video.metadata && (
                <div>
                  <h3 className="font-semibold mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {video.metadata.views !== undefined && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{formatNumber(video.metadata.views)}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                      </div>
                    )}
                    
                    {video.metadata.likes !== undefined && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{formatNumber(video.metadata.likes)}</p>
                          <p className="text-xs text-muted-foreground">Likes</p>
                        </div>
                      </div>
                    )}
                    
                    {video.metadata.comments !== undefined && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{formatNumber(video.metadata.comments)}</p>
                          <p className="text-xs text-muted-foreground">Comments</p>
                        </div>
                      </div>
                    )}
                    
                    {video.metadata.shares !== undefined && (
                      <div className="flex items-center gap-2">
                        <Share className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{formatNumber(video.metadata.shares)}</p>
                          <p className="text-xs text-muted-foreground">Shares</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Date Added */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Added to collection</p>
                  <p className="text-xs text-muted-foreground">
                    {video.createdAt instanceof Date 
                      ? video.createdAt.toLocaleDateString()
                      : new Date(video.createdAt.toDate()).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(video.url, "_blank")}
                >
                  View Original
                </Button>
                {video.thumbnailUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(video.thumbnailUrl, "_blank")}
                  >
                    View Thumbnail
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 