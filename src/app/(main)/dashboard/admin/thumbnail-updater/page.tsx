"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function ThumbnailUpdaterPage() {
  const [logs, setLogs] = useState<string[]>(['Process not started. Click the button to begin.']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateThumbnails = async () => {
    setIsLoading(true);
    setError(null);
    setLogs(['🚀 Kicking off the update process...']);

    try {
      const response = await fetch('/api/admin/update-thumbnails', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.logs.join('\\n') ?? 'An unknown error occurred.');
      }

      setLogs(data.logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setLogs(prev => [...prev, `🔴 Error: ${errorMessage}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Thumbnail Updater</CardTitle>
          <CardDescription>
            Use this tool to update all video thumbnails in the database to the latest Bunny CDN format.
            This process will scan all videos and update only those with outdated or missing thumbnails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleUpdateThumbnails}
              disabled={isLoading}
              className="shadow-sm transition-all hover:shadow-md"
            >
              {isLoading ? 'Updating...' : 'Start Thumbnail Update'}
            </Button>
            {isLoading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="animate-spin mr-2 h-4 w-4 rounded-full border-t-2 border-b-2 border-primary"></div>
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
            <h3 className="mb-2 font-medium">Update Logs:</h3>
            <ScrollArea className="h-72 w-full rounded-md border p-4 font-mono text-sm bg-muted/30">
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