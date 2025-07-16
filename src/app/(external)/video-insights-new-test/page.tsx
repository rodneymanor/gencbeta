"use client";

import { Button } from "@/components/ui/button";
import { VideoInsightsModalNew } from "@/app/(main)/research/collections/_components/video-insights-modal-new";

// Mock video data for testing
const mockVideo = {
  id: "test-video-1",
  title: "How to Create Viral Content in 2024",
  author: "ContentCreator",
  thumbnailUrl: "https://via.placeholder.com/300x400",
  originalUrl: "https://www.tiktok.com/@example/video/123456789",
  platform: "TikTok",
  addedAt: "2024-01-15T10:30:00Z",
  transcript:
    "Hey everyone! Today I'm going to share with you the secret to creating viral content. The first thing you need to understand is that viral content isn't about luck - it's about understanding your audience and giving them exactly what they want to see. Let me break this down for you step by step. First, you need to hook your audience within the first 3 seconds. This is crucial because if you don't grab their attention immediately, they'll scroll past your content faster than you can say 'algorithm'. The best hooks are either controversial statements, surprising facts, or relatable problems that your audience faces every day.",
  visualContext:
    "A creator talking directly to camera in a modern, well-lit room with motivational posters in the background",
  components: {
    hook: "Hey everyone! Today I'm going to share with you the secret to creating viral content.",
    bridge:
      "The first thing you need to understand is that viral content isn't about luck - it's about understanding your audience and giving them exactly what they want to see.",
    nugget:
      "You need to hook your audience within the first 3 seconds. This is crucial because if you don't grab their attention immediately, they'll scroll past your content.",
    wta: "Start implementing these hook strategies in your next 5 videos and watch your engagement skyrocket!",
  },
  metrics: {
    views: 2500000,
    likes: 450000,
    comments: 12500,
    shares: 8900,
    saves: 15600,
  },
  metadata: {
    author: "ContentCreator",
    description:
      "Learn the proven strategies that helped me grow from 0 to 1M followers! 🚀 In this video, I break down the exact formula for creating content that goes viral. From crafting the perfect hook to understanding what your audience really wants - I cover it all! Drop a 🔥 if you found this helpful! #ContentCreator #ViralContent #SocialMediaTips #ContentStrategy #CreatorTips",
    hashtags: [
      "#ContentCreator",
      "#ViralContent",
      "#SocialMediaTips",
      "#ContentStrategy",
      "#CreatorTips",
      "#Algorithm",
      "#Engagement",
      "#GrowthHacks",
    ],
  },
  iframeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
} as any;

export default function VideoInsightsNewTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Video Insights Modal - New Design</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Perplexity-inspired, card-first aesthetic with minimal chrome
          </p>
        </div>

        <div className="space-y-6">
          {/* Feature Highlights */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold">Design Features</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-medium text-blue-600">Layout</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Full-screen dialog (90vh/vw on mobile, 95vh/vw on desktop)</li>
                  <li>• 38% left column (video) / 62% right column (content)</li>
                  <li>• Sticky header with creator info + KPI pills (72px height)</li>
                  <li>• Scrollable right column, fixed left column</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-blue-600">Interactions</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Hover reveals translucent action bar</li>
                  <li>• Hook remix with expandable alternatives</li>
                  <li>• Arrow key navigation (↑/↓ for prev/next)</li>
                  <li>• Copy functionality with toast feedback</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-blue-600">Visual Style</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Low-ink, minimal chrome design</li>
                  <li>• Monochrome backgrounds with subtle accents</li>
                  <li>• Rounded cards with consistent spacing</li>
                  <li>• 200ms ease-out transitions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-blue-600">Accessibility</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Focus trap and keyboard navigation</li>
                  <li>• Screen reader announcements</li>
                  <li>• ARIA labels and semantic markup</li>
                  <li>• Proper color contrast ratios</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold">Try the Modal</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Click the button below to open the redesigned video insights modal. Test the hover interactions, keyboard
              navigation, and responsive design.
            </p>

            <div>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  const modal = document.querySelector('[data-modal="video-insights"]');
                  if (modal) {
                    modal.style.display = "block";
                  }
                }}
              >
                Open Video Insights Modal
              </Button>

              <VideoInsightsModalNew
                video={mockVideo}
                hasPrevious={true}
                hasNext={true}
                onNavigatePrevious={() => console.log("Navigate to previous video")}
                onNavigateNext={() => console.log("Navigate to next video")}
                open={true}
                onOpenChange={(open) => console.log("Modal open state:", open)}
              />
            </div>
          </div>

          {/* Color Tokens Reference */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold">Color Tokens</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="h-12 w-full rounded border bg-[#F9FAFB]"></div>
                <p className="text-sm font-medium">Surface Light</p>
                <p className="text-xs text-gray-500">#F9FAFB</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full rounded border bg-[#111]"></div>
                <p className="text-sm font-medium">Surface Dark</p>
                <p className="text-xs text-gray-500">#111</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full rounded border bg-[#3B82F6]"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-gray-500">#3B82F6</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full rounded border bg-[#E5E7EB]"></div>
                <p className="text-sm font-medium">Border Light</p>
                <p className="text-xs text-gray-500">#E5E7EB</p>
              </div>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
            <h2 className="mb-4 text-xl font-semibold text-blue-900 dark:text-blue-100">Test Instructions</h2>
            <div className="space-y-3 text-blue-800 dark:text-blue-200">
              <p>
                <strong>Desktop Testing:</strong>
              </p>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• Hover over the video to reveal the action bar</li>
                <li>• Use ↑/↓ arrow keys to navigate between videos</li>
                <li>• Test the hook remix functionality</li>
                <li>• Try copying different text elements</li>
              </ul>
              <p>
                <strong>Mobile Testing:</strong>
              </p>
              <ul className="ml-4 space-y-1 text-sm">
                <li>• Check responsive layout adaptation</li>
                <li>• Test touch interactions</li>
                <li>• Verify fullscreen behavior</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
