"use client";

import { useState } from "react";

import { Lightbulb, TrendingUp, Sparkles, FolderPlus, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for AI inspirations
const mockInspirations = [
  {
    id: 1,
    title: "Start with a shocking statistic",
    category: "Hooks",
    engagement: "92% High",
    trending: true,
  },
  {
    id: 2,
    title: "Use the 'A-B-T' (And, But, Therefore) framework for storytelling",
    category: "Bridges",
    engagement: "88% High",
    trending: false,
  },
  {
    id: 3,
    title: "Ask a question and get viewers to comment their answer",
    category: "CTAs",
    engagement: "95% Very High",
    trending: true,
  },
  {
    id: 4,
    title: "The '3-second rule' is dead. Aim for 1.5 seconds.",
    category: "Hooks",
    engagement: "85% High",
    trending: false,
  },
  {
    id: 5,
    title: "Bridge two unrelated topics with a surprising connection",
    category: "Bridges",
    engagement: "78% Medium",
    trending: false,
  },
  {
    id: 6,
    title: "Tell viewers to 'save this for later' instead of just 'like'",
    category: "CTAs",
    engagement: "89% High",
    trending: true,
  },
];

export default function AIIdeasPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredInspirations = mockInspirations.filter((inspiration) => {
    return categoryFilter === "all" || inspiration.category === categoryFilter;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Ideas</h1>
          <p className="text-muted-foreground">Trending ideas to kickstart your next script</p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="hooks">Hooks</SelectItem>
            <SelectItem value="bridges">Bridges</SelectItem>
            <SelectItem value="ctas">CTAs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inspirations Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredInspirations.map((inspiration) => (
          <Card key={inspiration.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{inspiration.category}</Badge>
                {inspiration.trending && (
                  <Badge>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Trending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-lg font-semibold">{inspiration.title}</p>
            </CardContent>
            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Sparkles className="text-primary h-4 w-4" />
                  <span>{inspiration.engagement}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FolderPlus className="h-4 w-4" />
                    Save
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Use
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
