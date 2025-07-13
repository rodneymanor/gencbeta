"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

import { VideoInsightsModalRedesigned } from "@/app/(main)/research/collections/_components/video-insights-modal-redesigned";

// Sample video data for testing
const sampleVideos = [
  {
    id: "test-video-1",
    title: "How to Build a Successful Content Strategy in 2024",
    originalUrl: "https://www.tiktok.com/@contentcreator/video/123456789",
    thumbnailUrl: "https://via.placeholder.com/300x400/000000/FFFFFF?text=Video+1",
    platform: "tiktok",
    addedAt: "2024-01-15T10:30:00Z",
    duration: 45,
    metrics: {
      views: 1250000,
      likes: 89000,
      comments: 3400,
      shares: 2100,
      saves: 5600
    },
    metadata: {
      originalUrl: "https://www.tiktok.com/@contentcreator/video/123456789",
      platform: "tiktok",
      downloadedAt: "2024-01-15T10:30:00Z",
      author: "ContentCreator Pro",
      description: "Learn the secrets to building a content strategy that actually works in 2024. From platform selection to audience engagement, we cover everything you need to know to grow your following and increase your reach.",
      hashtags: ["contentstrategy", "socialmedia", "growth", "marketing", "2024"]
    },
    components: {
      hook: "What if I told you that 80% of content creators are doing it wrong? Here's the strategy that helped me grow from 0 to 1M followers in just 6 months.",
      bridge: "But before we dive into the strategy, let me share the three biggest mistakes I see creators making every single day.",
      nugget: "The key is not just creating content, but creating content that your audience actually wants to consume and share. This means understanding their pain points, desires, and what motivates them to take action.",
      wta: "Start by analyzing your top 3 performing posts from the last 30 days. What do they have in common? Use this pattern as your content foundation."
    },
    transcript: "Hey everyone, welcome back to my channel. Today I want to talk about something that's been on my mind a lot lately - content strategy. I see so many creators struggling with this, and honestly, I was there too. But what I've learned over the past year has completely changed my approach to content creation. So let's dive into the three biggest mistakes I see creators making, and then I'll share the strategy that helped me grow from zero to one million followers in just six months. The first mistake is not understanding your audience. You can't create content that resonates if you don't know who you're talking to. The second mistake is being inconsistent. Your audience needs to know when to expect content from you. And the third mistake is not analyzing your data. You need to understand what's working and what's not. Now, let me share the strategy that changed everything for me...",
    visualContext: "Creator speaking directly to camera in well-lit studio setup with animated graphics and text overlays highlighting key points."
  },
  {
    id: "test-video-2",
    title: "5 Instagram Reels Hacks That Actually Work",
    originalUrl: "https://www.instagram.com/reel/987654321",
    thumbnailUrl: "https://via.placeholder.com/300x400/FF0080/FFFFFF?text=Video+2",
    platform: "instagram",
    addedAt: "2024-01-14T15:45:00Z",
    duration: 32,
    metrics: {
      views: 890000,
      likes: 67000,
      comments: 2100,
      shares: 1800,
      saves: 4200
    },
    metadata: {
      originalUrl: "https://www.instagram.com/reel/987654321",
      platform: "instagram",
      downloadedAt: "2024-01-14T15:45:00Z",
      author: "InstagramGuru",
      description: "Stop wasting time on Instagram Reels that don't work! Here are 5 proven hacks that will actually boost your engagement and reach. These aren't just tips - they're strategies that I've tested and proven to work.",
      hashtags: ["instagramreels", "socialmediamarketing", "engagement", "growthhacks", "instagramtips"]
    },
    components: {
      hook: "I tested 50 different Instagram Reels strategies, and only 5 actually worked. Here's what you need to know.",
      bridge: "Before I share these hacks, let me tell you why most creators are getting this completely wrong.",
      nugget: "The algorithm doesn't care about your follower count - it cares about engagement velocity. The faster you get engagement, the more the algorithm pushes your content.",
      wta: "Try implementing these 5 hacks in your next 3 Reels and track your engagement rate. You'll see the difference immediately."
    },
    transcript: "Hey Instagram creators! I've been testing different Reels strategies for the past 6 months, and I want to share with you the 5 hacks that actually work. Most of the advice you see online is outdated or just plain wrong. But these 5 strategies have consistently helped me and my clients increase their reach and engagement. The first hack is all about timing. The algorithm favors content that gets engagement quickly. So the first 30 minutes after you post are crucial. The second hack involves using trending audio strategically. But here's the key - you need to use it in a way that's authentic to your brand. The third hack is about the first 3 seconds. You have to hook people immediately, or they'll scroll past. The fourth hack is about consistency. The algorithm loves creators who post regularly. And the fifth hack is about engagement baiting - but the right way. You want to encourage genuine engagement, not just likes. Let me break down each of these in detail...",
    visualContext: "Creator in trendy outfit demonstrating Instagram Reels features with phone screen recordings and animated text overlays."
  },
  {
    id: "test-video-3",
    title: "YouTube Shorts vs TikTok: Which Platform Should You Focus On?",
    originalUrl: "https://www.youtube.com/shorts/abcdef123",
    thumbnailUrl: "https://via.placeholder.com/300x400/FF0000/FFFFFF?text=Video+3",
    platform: "youtube",
    addedAt: "2024-01-13T09:20:00Z",
    duration: 58,
    metrics: {
      views: 2100000,
      likes: 156000,
      comments: 8900,
      shares: 3400,
      saves: 7800
    },
    metadata: {
      originalUrl: "https://www.youtube.com/shorts/abcdef123",
      platform: "youtube",
      downloadedAt: "2024-01-13T09:20:00Z",
      author: "YouTubeAnalyst",
      description: "Confused about whether to focus on YouTube Shorts or TikTok? I analyzed 1000+ creators and their performance data to give you the definitive answer. The results might surprise you!",
      hashtags: ["youtubeshorts", "tiktok", "platformcomparison", "contentstrategy", "youtubetips"]
    },
    components: {
      hook: "I analyzed 1000+ creators across YouTube Shorts and TikTok. The results will shock you.",
      bridge: "But before I reveal which platform is actually better for creators, let me share the data that changed my entire perspective.",
      nugget: "The platform you should focus on depends entirely on your content type and audience demographics. YouTube Shorts favors educational content, while TikTok excels at entertainment.",
      wta: "Choose your primary platform based on your content type, then use the other as a secondary distribution channel. Don't try to be everywhere at once."
    },
    transcript: "Hey content creators! I've been getting a lot of questions about whether to focus on YouTube Shorts or TikTok, so I decided to do a comprehensive analysis. I looked at over 1000 creators across both platforms, analyzed their performance data, and I'm going to share the results with you today. The findings are pretty surprising. First, let's talk about audience demographics. TikTok has a younger audience, with most users between 16-24. YouTube Shorts, on the other hand, has a broader age range and tends to favor educational content. When it comes to monetization, YouTube Shorts has the advantage because of the YouTube Partner Program. But TikTok has better discoverability for new creators. The engagement rates are actually quite similar, but the types of content that perform well are different. Let me break down the data for you...",
    visualContext: "Creator in professional setting with charts and graphs showing platform comparison data, split-screen showing both platforms."
  }
];

export default function VideoInsightsRedesignTestPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentVideoIndex(prev => prev > 0 ? prev - 1 : sampleVideos.length - 1);
  };

  const handleNext = () => {
    setCurrentVideoIndex(prev => prev < sampleVideos.length - 1 ? prev + 1 : 0);
  };

  const currentVideo = sampleVideos[currentVideoIndex];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            Video Insights Modal Redesign Test
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This page demonstrates the new redesigned video insights modal with Instagram Reels-style layout, 
            featuring split-screen design, consolidated actions, and improved mobile responsiveness.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Test the New Modal Design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">New Features</h3>
                <p className="text-sm text-muted-foreground">
                  • Creator metadata in top bar<br/>
                  • Key KPIs (views, likes, comments, shares, completion)<br/>
                  • 1/3 video, 2/3 content layout<br/>
                  • Hook remix functionality<br/>
                  • Collapsible insights sections<br/>
                  • Navigation between videos
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Current Video</h3>
                <p className="text-sm text-muted-foreground">
                  • {currentVideo.title}<br/>
                  • Platform: {currentVideo.platform}<br/>
                  • Author: {currentVideo.metadata.author}<br/>
                  • Views: {currentVideo.metrics.views.toLocaleString()}<br/>
                  • Duration: {currentVideo.duration}s
                </p>
              </div>
            </div>

            <div className="pt-4">
              <VideoInsightsModalRedesigned 
                video={currentVideo}
                onNavigatePrevious={handlePrevious}
                onNavigateNext={handleNext}
                hasPrevious={true}
                hasNext={true}
              >
                <Button className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Open Redesigned Video Insights Modal
                </Button>
              </VideoInsightsModalRedesigned>
            </div>

            {/* Video Navigation Controls */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={sampleVideos.length <= 1}
              >
                Previous Video
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentVideoIndex + 1} of {sampleVideos.length}
              </span>
              <Button 
                variant="outline" 
                onClick={handleNext}
                disabled={sampleVideos.length <= 1}
              >
                Next Video
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Top Bar Enhancements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Removed large "Video Insights" label</li>
                  <li>• Added creator avatar and metadata</li>
                  <li>• Consolidated KPIs (views, likes, comments, shares, completion)</li>
                  <li>• Navigation arrows for video switching</li>
                  <li>• Platform badge and publish date</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Layout & Functionality</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1/3 video width, 2/3 content width</li>
                  <li>• Hook card with remix functionality</li>
                  <li>• Collapsible sections for better organization</li>
                  <li>• Sticky action bar below video</li>
                  <li>• Enhanced copy/save functionality</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Videos Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleVideos.map((video, index) => (
                <div 
                  key={video.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    index === currentVideoIndex 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentVideoIndex(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{video.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {video.metadata.author} • {video.platform} • {video.metrics.views.toLocaleString()} views
                      </div>
                    </div>
                    {index === currentVideoIndex && (
                      <div className="text-xs text-primary font-medium">Current</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 