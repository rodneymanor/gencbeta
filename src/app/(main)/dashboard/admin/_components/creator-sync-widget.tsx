"use client";

import { useState } from "react";
import { RefreshCw, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SyncResult {
  success: boolean;
  syncedCreators: number;
  errors: Array<{
    creatorId: string;
    username: string;
    error: string;
  }>;
  message: string;
}

export function CreatorSyncWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [specificCreators, setSpecificCreators] = useState("");
  const [syncVideos, setSyncVideos] = useState(false);
  const [syncAllCreators, setSyncAllCreators] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [delayBetweenCreators, setDelayBetweenCreators] = useState(5000); // 5 seconds default

  const handleSync = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const requestBody: any = {
        adminKey: "GenC-Admin-Sync-2025", // You might want to make this configurable
        syncVideos,
        dryRun,
        delayBetweenCreators,
      };

      // If not syncing all creators, parse the specific creator IDs
      if (!syncAllCreators && specificCreators.trim()) {
        const creatorIds = specificCreators
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        if (creatorIds.length > 0) {
          requestBody.creatorIds = creatorIds;
        }
      }

      console.log('🔄 [ADMIN_UI] Starting sync with payload:', requestBody);

      const response = await fetch('/api/admin/sync-creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setResult(data);
      console.log('✅ [ADMIN_UI] Sync completed:', data);
    } catch (error) {
      console.error('❌ [ADMIN_UI] Sync error:', error);
      setResult({
        success: false,
        syncedCreators: 0,
        errors: [{
          creatorId: '',
          username: 'System',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }],
        message: 'Sync failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Creator Profile Sync</CardTitle>
        <RefreshCw className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Update creator profiles with latest data from Instagram API
        </p>

        {/* Sync Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sync-all"
              checked={syncAllCreators}
              onCheckedChange={(checked) => setSyncAllCreators(checked as boolean)}
            />
            <Label htmlFor="sync-all" className="text-sm font-medium">
              Sync all creators
            </Label>
          </div>

          {!syncAllCreators && (
            <div className="space-y-2">
              <Label htmlFor="specific-creators" className="text-sm font-medium">
                Specific Creator IDs (one per line)
              </Label>
              <Textarea
                id="specific-creators"
                placeholder="2hz8cIzPLYjcZN6NqPbi&#10;2FhmnQiuFsTfOadoWPb9&#10;unWLaTEOsRrM8mf5Esf5"
                value={specificCreators}
                onChange={(e) => setSpecificCreators(e.target.value)}
                rows={4}
                className="text-xs"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sync-videos"
              checked={syncVideos}
              onCheckedChange={(checked) => setSyncVideos(checked as boolean)}
            />
            <Label htmlFor="sync-videos" className="text-sm font-medium">
              Also sync new videos
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dry-run"
              checked={dryRun}
              onCheckedChange={(checked) => setDryRun(checked as boolean)}
            />
            <Label htmlFor="dry-run" className="text-sm font-medium">
              Dry run (test mode - no API calls)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delay-slider" className="text-sm font-medium">
              Delay between creators: {delayBetweenCreators / 1000}s
            </Label>
            <input
              id="delay-slider"
              type="range"
              min="1000"
              max="30000"
              step="1000"
              value={delayBetweenCreators}
              onChange={(e) => setDelayBetweenCreators(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1s</span>
              <span>Conservative (less API stress)</span>
              <span>30s</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sync Button */}
        <Button
          onClick={handleSync}
          disabled={isLoading}
          className="w-full"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Sync
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {result.success ? 'Sync Completed' : 'Sync Failed'}
                </span>
              </div>
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.syncedCreators} synced
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {result.message}
            </p>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs font-medium">Errors ({result.errors.length})</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium">@{error.username}</div>
                      <div className="text-red-600">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Details */}
            {result.success && result.syncedCreators > 0 && (
              <div className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                <div className="text-green-700">
                  ✅ {dryRun ? 'DRY RUN: Would have updated' : 'Successfully updated'} {result.syncedCreators} creator profile{result.syncedCreators !== 1 ? 's' : ''} {dryRun ? '' : 'with latest:'}
                </div>
                {!dryRun && (
                  <ul className="mt-1 text-green-600 list-disc list-inside text-xs">
                    <li>Follower/following counts</li>
                    <li>Bio and profile description</li>
                    <li>Profile images (HD)</li>
                    <li>Verification status</li>
                    <li>External URLs</li>
                    {syncVideos && <li>New videos</li>}
                  </ul>
                )}
                {dryRun && (
                  <div className="mt-1 text-green-600 text-xs">
                    🧪 This was a test run - no actual API calls were made
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}