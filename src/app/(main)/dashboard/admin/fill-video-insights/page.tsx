"use client";

import { useState } from "react";

import { Terminal } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FillVideoInsightsPage() {
  const [logs, setLogs] = useState<string[]>(["Process not started. Click the button to begin."]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    setLogs(["🚀 Kicking off insights backfill..."]);

    try {
      const response = await fetch("/api/admin/fill-video-insights", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.logs?.join("\n") ?? "An unknown error occurred.");
      }

      setLogs(data.logs ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setLogs((prev) => [...prev, `🔴 Error: ${message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Video Insights Backfill</CardTitle>
          <CardDescription>
            This tool scans existing videos and adds missing transcripts, script components, captions/descriptions,
            hashtags, and engagement metrics. Existing data will not be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button onClick={handleRun} disabled={isLoading} className="shadow-sm transition-all hover:shadow-md">
              {isLoading ? "Running..." : "Start Insights Backfill"}
            </Button>
            {isLoading && (
              <div className="text-muted-foreground flex items-center text-sm">
                <div className="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-b-2"></div>
                Process is running in the background...
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="mb-2 font-medium">Logs:</h3>
            <ScrollArea className="bg-muted/30 h-72 w-full rounded-md border p-4 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
