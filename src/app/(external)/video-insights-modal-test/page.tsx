"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VideoInsightsModalRedesigned } from "@/app/(main)/research/collections/_components/video-insights-modal-redesigned";
import type { VideoWithPlayer } from "@/app/(main)/research/collections/_components/collections-helpers";

// Sample video data for testing
const sampleVideos: VideoWithPlayer[] = [
  {
    id: "1",
    title: "How to Build a $10K Business in 30 Days",
    originalUrl: "https://www.tiktok.com/@creator1/video/123456789",
    iframeUrl: "https://www.tiktok.com/embed/123456789",
    platform: "tiktok",
    metrics: {
      views: 1250000,
      likes: 89000,
      comments: 3400,
      shares: 2100,
      saves: 5600
    },
    metadata: {
      author: "business_guru",
      description: "The exact framework I used to build a $10K business in just 30 days. No fluff, just actionable steps that work.",
      hashtags: ["business", "entrepreneur", "success", "money", "startup"],
      publishedAt: "2024-01-15T10:30:00Z"
    },
    contentMetadata: {
      author: "business_guru",
      description: "The exact framework I used to build a $10K business in just 30 days. No fluff, just actionable steps that work.",
      hashtags: ["business", "entrepreneur", "success", "money", "startup"]
    },
    visualContext: "The exact framework I used to build a $10K business in just 30 days. No fluff, just actionable steps that work.",
    insights: {
      hook: "What if I told you there's a secret method that 95% of entrepreneurs don't know about?",
      script: "Today I'm going to share the exact framework that helped me build a $10K business in just 30 days. This isn't theory - this is what actually worked for me and my clients.",
      transcript: "Hey everyone, today I want to share something that completely changed my business trajectory. When I first started, I was making all the classic mistakes - trying to do everything at once, not focusing on what actually drives revenue. But then I discovered this framework that literally transformed everything. Let me break it down for you step by step...",
      analysis: {
        engagementRate: 8.5,
        completionRate: 78,
        hookStrength: "Strong",
        callToAction: "Effective",
        audienceRetention: "High"
      }
    }
  },
  {
    id: "2",
    title: "The Psychology of Viral Content",
    originalUrl: "https://www.instagram.com/reel/987654321",
    iframeUrl: "https://www.instagram.com/embed/987654321",
    platform: "instagram",
    metrics: {
      views: 890000,
      likes: 67000,
      comments: 2800,
      shares: 1800,
      saves: 4200
    },
    metadata: {
      author: "content_psychologist",
      description: "Understanding the psychology behind viral content and how to apply these principles to your own content strategy.",
      hashtags: ["content", "psychology", "viral", "strategy", "socialmedia"],
      publishedAt: "2024-01-20T14:15:00Z"
    },
    contentMetadata: {
      author: "content_psychologist",
      description: "Understanding the psychology behind viral content and how to apply these principles to your own content strategy.",
      hashtags: ["content", "psychology", "viral", "strategy", "socialmedia"]
    },
    visualContext: "Understanding the psychology behind viral content and how to apply these principles to your own content strategy.",
    insights: {
      hook: "Why do some videos go viral while others flop? The answer lies in psychology.",
      script: "Today we're diving deep into the psychology of viral content. I've analyzed thousands of viral videos and found the common patterns that make content shareable.",
      transcript: "Have you ever wondered why some videos get millions of views while others barely get any engagement? It's not just luck - there's actual psychology behind it. Today I'm going to break down the key psychological principles that make content go viral...",
      analysis: {
        engagementRate: 7.2,
        completionRate: 82,
        hookStrength: "Very Strong",
        callToAction: "Good",
        audienceRetention: "Very High"
      }
    }
  },
  {
    id: "3",
    title: "5 Morning Habits That Changed My Life",
    originalUrl: "https://www.youtube.com/watch?v=abc123def",
    iframeUrl: "https://www.youtube.com/embed/abc123def",
    platform: "youtube",
    metrics: {
      views: 2100000,
      likes: 156000,
      comments: 8900,
      shares: 3400,
      saves: 12000
    },
    metadata: {
      author: "lifestyle_coach",
      description: "The five morning habits that completely transformed my productivity, health, and overall life satisfaction.",
      hashtags: ["morning", "habits", "productivity", "lifestyle", "health"],
      publishedAt: "2024-01-25T08:00:00Z"
    },
    contentMetadata: {
      author: "lifestyle_coach",
      description: "The five morning habits that completely transformed my productivity, health, and overall life satisfaction.",
      hashtags: ["morning", "habits", "productivity", "lifestyle", "health"]
    },
    visualContext: "The five morning habits that completely transformed my productivity, health, and overall life satisfaction.",
    insights: {
      hook: "I used to hit snooze 5 times every morning. Now I wake up at 5 AM feeling energized. Here's what changed.",
      script: "Today I'm sharing the five morning habits that completely changed my life. These aren't just tips - they're game-changers that transformed my entire day.",
      transcript: "Good morning everyone! Today I want to share something that completely changed my life. I used to be that person who would hit snooze five times every morning, rush out the door, and feel exhausted by 10 AM. But then I discovered these five morning habits that literally transformed everything...",
      analysis: {
        engagementRate: 9.1,
        completionRate: 85,
        hookStrength: "Excellent",
        callToAction: "Very Effective",
        audienceRetention: "Exceptional"
      }
    }
  }
];

export default function VideoInsightsModalTestPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentVideo = sampleVideos[currentVideoIndex];
  const hasPrevious = currentVideoIndex > 0;
  const hasNext = currentVideoIndex < sampleVideos.length - 1;

  const handleNavigatePrevious = () => {
    if (hasPrevious) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Video Insights Modal Test</h1>
          <p className="text-muted-foreground">
            Testing the redesigned video insights modal with navigation functionality
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Current video: {currentVideoIndex + 1} of {sampleVideos.length}
          </div>
        </div>

        {/* Video Preview Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Video Thumbnail */}
            <div className="relative w-32 h-48 bg-black rounded-lg overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-xs text-center p-2">
                  {currentVideo.platform.toUpperCase()}
                  <br />
                  Video Preview
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">{currentVideo.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">
                by @{currentVideo.metadata?.author}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>👁️ {currentVideo.metrics?.views?.toLocaleString()}</span>
                <span>❤️ {currentVideo.metrics?.likes?.toLocaleString()}</span>
                <span>💬 {currentVideo.metrics?.comments?.toLocaleString()}</span>
                <span>📤 {currentVideo.metrics?.shares?.toLocaleString()}</span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {currentVideo.metadata?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={handleNavigatePrevious}
            disabled={!hasPrevious}
            className="flex items-center gap-2"
          >
            ← Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {currentVideoIndex + 1} of {sampleVideos.length}
          </span>
          
          <Button
            variant="outline"
            onClick={handleNavigateNext}
            disabled={!hasNext}
            className="flex items-center gap-2"
          >
            Next →
          </Button>
        </div>

        {/* Open Modal Button */}
        <div className="text-center">
          <VideoInsightsModalRedesigned
            video={currentVideo}
            onNavigatePrevious={handleNavigatePrevious}
            onNavigateNext={handleNavigateNext}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Open Video Insights Modal
            </Button>
          </VideoInsightsModalRedesigned>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click "Open Video Insights Modal" to see the redesigned modal</li>
            <li>• Use the navigation arrows in the middle panel to switch between videos</li>
            <li>• On mobile, navigation arrows appear in the top-left of the video</li>
            <li>• Test the collapsible sections and "Re-mix Hook" functionality</li>
            <li>• Try switching between Overview and Analysis tabs</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 