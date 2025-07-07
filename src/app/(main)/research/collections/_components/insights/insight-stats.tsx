import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Heart, MessageCircle, Share2, View } from "lucide-react";
import type { Video } from "@/lib/collections";
import { formatNumber } from "@/lib/utils";

interface InsightStatsProps {
  video: Video;
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function InsightStats({ video }: InsightStatsProps) {
  const metrics = video.metrics ?? {};
  const engagementRate = video.insights?.engagementRate;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Key Metrics</h3>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Views" value={formatNumber(metrics.views ?? 0)} icon={View} />
        <StatCard title="Likes" value={formatNumber(metrics.likes ?? 0)} icon={Heart} />
        <StatCard title="Comments" value={formatNumber(metrics.comments ?? 0)} icon={MessageCircle} />
        <StatCard title="Shares" value={formatNumber(metrics.shares ?? 0)} icon={Share2} />
        <StatCard
          title="Engagement Rate"
          value={`${(engagementRate * 100).toFixed(2)}%`}
          icon={BarChart}
        />
      </div>
    </div>
  );
} 