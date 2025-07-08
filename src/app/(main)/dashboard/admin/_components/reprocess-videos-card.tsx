"use client";

import { useState } from "react";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export function ReprocessVideosCard() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleReprocess = async () => {
    if (!user) {
      toast.error("Authentication Error", { description: "You must be logged in to perform this action." });
      return;
    }

    setIsLoading(true);
    toast.info("Starting Video Reprocessing", {
      description: "This may take several minutes. Please do not navigate away.",
    });

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/video/reprocess-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to start reprocessing.");
      }

      toast.success("Reprocessing Complete", {
        description: `Processed: ${result.processedCount}, Failed: ${result.failedCount}, Total: ${result.totalVideos}`,
      });
    } catch (error) {
      console.error("Reprocessing error:", error);
      toast.error("Reprocessing Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Video Reprocessing</CardTitle>
        <CardDescription>
          Trigger a complete reprocessing of all videos in the database. This will regenerate all analysis data,
          including transcripts, hooks, and other insights. This is a long-running and resource-intensive operation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading}>
              {isLoading ? "Reprocessing..." : "Start Reprocessing All Videos"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will re-analyze every video in the system, which may take a very long
                time and will consume significant resources. Do not run this unless absolutely necessary.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReprocess} disabled={isLoading}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
