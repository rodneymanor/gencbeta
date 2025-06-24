"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { socialMetrics } from "./_components/dashboard-data";
import HeroSection from "./_components/hero-section";
import QuickAccessGrid from "./_components/quick-access-grid";

export default function DashboardHomePage() {
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  return (
    <div className="@container/main">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:space-y-10 md:p-6">
        <HeroSection />

        {/* Stats Overview */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-2xl font-semibold">Performance Overview</h2>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {socialMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <Card key={index} className="bg-card border-0 transition-all duration-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`rounded-lg p-2 ${metric.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${metric.color}`} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {metric.growth}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-foreground font-semibold">{metric.platform}</h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Followers</span>
                          <span className="font-medium">{metric.followers}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Engagement</span>
                          <span className="font-medium">{metric.engagement}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <QuickAccessGrid />
      </div>

      {/* Aurora text effect styles */}
      <style jsx>{`
        .aurora-text {
          background: linear-gradient(45deg, hsl(var(--primary)), #a855f7, #ec4899, hsl(var(--primary)), #3b82f6);
          background-size: 300% 300%;
          animation: aurora 4s ease-in-out infinite;
        }

        @keyframes aurora {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
