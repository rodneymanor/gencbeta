"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoPlayer } from "@/components/video-player";

interface VideoCardProps {
  video: {
    id?: string;
    url: string;
    platform: string;
    title: string;
    author: string;
    hostedOnCDN?: boolean;
    videoData?: {
      buffer: number[];
      size: number;
      mimeType: string;
      filename: string;
    };
    insights: {
      views: number;
      likes: number;
      comments: number;
      shares?: number;
    };
  };
  manageMode: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelection: () => void;
  onDelete: () => void;
}

export const VideoCard = ({
  video,
  manageMode,
  isSelected,
  isDeleting,
  onToggleSelection,
  onDelete,
}: VideoCardProps) => {
  return (
    <div
      className={`relative mx-auto w-full max-w-sm transition-all duration-300 ease-in-out ${
        isDeleting ? "translate-y-2 scale-95 transform opacity-0" : "translate-y-0 scale-100 transform opacity-100"
      } ${manageMode && isSelected ? "ring-primary ring-2 ring-offset-2" : ""}`}
    >
      {/* Use VideoPlayer Component with its own card */}
      <VideoPlayer
        videoUrl={video.url}
        platform={video.platform as "tiktok" | "instagram"}
        metrics={{
          views: video.insights.views,
          likes: video.insights.likes,
          comments: video.insights.comments,
          shares: video.insights.shares ?? 0,
        }}
        insights={{
          reach: video.insights.views * 1.2, // Estimate
          impressions: video.insights.views * 1.5, // Estimate
          engagementRate: ((video.insights.likes + video.insights.comments) / video.insights.views) * 100,
          topHours: ["18:00", "19:00", "20:00"], // Placeholder
          demographics: [
            { ageGroup: "18-24", percentage: 35 },
            { ageGroup: "25-34", percentage: 40 },
            { ageGroup: "35-44", percentage: 25 },
          ],
          growthRate: 15.2, // Placeholder
        }}
        title={video.title}
        author={video.author}
        hostedOnCDN={video.hostedOnCDN}
        videoData={video.videoData}
        className="h-full w-full"
      />

      {manageMode && (
        <>
          {/* Checkbox for multi-select */}
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 border-2 bg-white/90 backdrop-blur-sm"
            />
          </div>

          {/* Individual delete button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500/90 p-0 text-white backdrop-blur-sm transition-all duration-200 hover:bg-red-600"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};
