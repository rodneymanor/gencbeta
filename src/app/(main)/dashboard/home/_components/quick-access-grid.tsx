import { useState } from "react";

import { Mic, TrendingUp, Play, Pause, FileText, Eye, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { recentScripts, voiceRecordings, aiSuggestions } from "./dashboard-data";

export default function QuickAccessGrid() {
  const [playingRecording, setPlayingRecording] = useState<number | null>(null);

  const toggleRecording = (id: number) => {
    setPlayingRecording(playingRecording === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Draft":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Scheduled":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case "Very High":
        return "bg-red-500/10 text-red-600";
      case "High":
        return "bg-orange-500/10 text-orange-600";
      case "Medium":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-foreground text-2xl font-semibold">Quick Access</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Scripts */}
        <Card className="bg-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-primary h-5 w-5" />
              Recent Scripts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentScripts.map((script) => (
              <div
                key={script.id}
                className="bg-muted/30 hover:bg-muted/50 cursor-pointer rounded-lg p-4 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 rounded-lg ${script.thumbnail} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-foreground truncate font-medium">{script.title}</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className={`border text-xs ${getStatusColor(script.status)}`}>{script.status}</Badge>
                      <span className="text-muted-foreground text-xs">{script.createdAt}</span>
                    </div>
                    <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {script.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {script.engagement}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Voice Recordings */}
        <Card className="bg-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="text-primary h-5 w-5" />
              Voice Recordings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {voiceRecordings.map((recording) => (
              <div key={recording.id} className="bg-muted/30 hover:bg-muted/50 rounded-lg p-4 transition-colors">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-foreground font-medium">{recording.title}</h4>
                  <span className="text-muted-foreground text-xs">{recording.duration}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleRecording(recording.id)}
                    className="h-8 w-8 p-0"
                  >
                    {playingRecording === recording.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>

                  <div className="flex h-8 flex-1 items-end gap-1">
                    {recording.waveform.map((height, index) => (
                      <div
                        key={index}
                        className={`w-1 rounded-full transition-colors ${
                          playingRecording === recording.id ? "bg-primary" : "bg-muted-foreground/40"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="bg-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-muted/30 hover:bg-muted/50 cursor-pointer rounded-lg p-4 transition-colors"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="text-foreground text-sm font-medium">{suggestion.title}</h4>
                  {suggestion.trending && (
                    <Badge className="bg-red-500/10 text-xs text-red-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Trending
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3 text-xs">{suggestion.description}</p>
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${getEngagementColor(suggestion.engagement)}`}>
                    {suggestion.engagement} Engagement
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    Use Idea
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
