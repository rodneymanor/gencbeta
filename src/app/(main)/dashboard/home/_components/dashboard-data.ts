import { Instagram, Twitter, Youtube, Smartphone } from "lucide-react";

export const socialMetrics = [
  {
    platform: "Instagram",
    icon: Instagram,
    followers: "125.3K",
    engagement: "4.2%",
    growth: "+12.5%",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    platform: "TikTok",
    icon: Smartphone,
    followers: "89.7K",
    engagement: "6.8%",
    growth: "+23.1%",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    platform: "YouTube",
    icon: Youtube,
    followers: "45.2K",
    engagement: "3.9%",
    growth: "+8.7%",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    platform: "Twitter",
    icon: Twitter,
    followers: "32.1K",
    engagement: "2.1%",
    growth: "+5.4%",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

export const recentScripts = [
  {
    id: 1,
    title: "Morning Routine Tips",
    status: "Published",
    views: "12.3K",
    engagement: "8.2%",
    createdAt: "2 hours ago",
    thumbnail: "bg-gradient-to-br from-orange-400 to-pink-500",
  },
  {
    id: 2,
    title: "Tech Review Script",
    status: "Draft",
    views: "0",
    engagement: "0%",
    createdAt: "5 hours ago",
    thumbnail: "bg-gradient-to-br from-blue-400 to-purple-500",
  },
  {
    id: 3,
    title: "Cooking Tutorial",
    status: "Scheduled",
    views: "0",
    engagement: "0%",
    createdAt: "1 day ago",
    thumbnail: "bg-gradient-to-br from-green-400 to-blue-500",
  },
];

export const voiceRecordings = [
  {
    id: 1,
    title: "Intro Hook Ideas",
    duration: "2:34",
    isPlaying: false,
    waveform: [20, 45, 32, 67, 23, 89, 45, 32, 78, 23, 56, 34],
  },
  {
    id: 2,
    title: "Call to Action",
    duration: "1:12",
    isPlaying: false,
    waveform: [45, 23, 67, 34, 78, 23, 45, 89, 23, 56, 34, 67],
  },
  {
    id: 3,
    title: "Product Demo",
    duration: "4:56",
    isPlaying: false,
    waveform: [34, 67, 23, 45, 78, 34, 23, 56, 89, 45, 23, 67],
  },
];

export const aiSuggestions = [
  {
    id: 1,
    title: "Trending: Mental Health Content",
    description: "Create content around mindfulness and self-care",
    trending: true,
    engagement: "High",
  },
  {
    id: 2,
    title: "Viral Format: Before & After",
    description: "Show transformation stories in your niche",
    trending: true,
    engagement: "Very High",
  },
  {
    id: 3,
    title: "Educational: How-to Series",
    description: "Break down complex topics into simple steps",
    trending: false,
    engagement: "Medium",
  },
];
