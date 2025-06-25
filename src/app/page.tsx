import VideoPlayer from "@/components/video-player";

export default function Home() {
  const sampleMetrics = {
    views: 1250000,
    likes: 89500,
    comments: 12300,
    shares: 5600,
  };

  const sampleInsights = {
    reach: 980000,
    impressions: 1450000,
    engagementRate: 7.2,
    growthRate: 23.5,
    topHours: ["7-9 PM", "12-2 PM", "8-10 PM"],
    demographics: [
      { ageGroup: "18-24", percentage: 45 },
      { ageGroup: "25-34", percentage: 32 },
      { ageGroup: "35-44", percentage: 18 },
      { ageGroup: "45+", percentage: 5 },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">Professional Video Player</h1>
          <p className="text-lg text-gray-300">Embed TikTok and Instagram Reels with comprehensive analytics</p>
        </div>

        <div className="grid grid-cols-1 justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Instagram Reel Example */}
          <VideoPlayer
            videoUrl="https://www.instagram.com/p/ABC123/"
            platform="instagram"
            metrics={sampleMetrics}
            insights={sampleInsights}
          />

          {/* TikTok Example */}
          <VideoPlayer
            videoUrl="https://www.tiktok.com/@user/video/1234567890"
            platform="tiktok"
            metrics={{
              views: 2100000,
              likes: 156000,
              comments: 8900,
              shares: 12400,
            }}
            insights={{
              reach: 1800000,
              impressions: 2500000,
              engagementRate: 8.9,
              growthRate: 45.2,
              topHours: ["6-8 PM", "9-11 PM", "1-3 PM"],
              demographics: [
                { ageGroup: "16-24", percentage: 52 },
                { ageGroup: "25-34", percentage: 28 },
                { ageGroup: "35-44", percentage: 15 },
                { ageGroup: "45+", percentage: 5 },
              ],
            }}
          />

          {/* Simple Example without insights */}
          <VideoPlayer
            videoUrl="https://www.instagram.com/p/XYZ789/"
            platform="instagram"
            metrics={{
              views: 45600,
              likes: 3200,
            }}
          />
        </div>
      </div>
    </div>
  );
}
