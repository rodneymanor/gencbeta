"use client";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ApiKeyData {
  keyId: string;
  status: "active" | "disabled";
  createdAt: string;
  lastUsed?: string;
  requestCount: number;
  violations: number;
  lockoutUntil?: string;
  revokedAt?: string;
}

interface KeyHistoryProps {
  keyHistory: ApiKeyData[];
}

export function KeyHistory({ keyHistory }: KeyHistoryProps) {
  if (keyHistory.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Key History
        </CardTitle>
        <CardDescription>Previous API keys and their usage statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {keyHistory.map((key) => (
            <div key={key.keyId} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{key.keyId}</span>
                  <Badge variant={key.status === "active" ? "default" : "secondary"}>{key.status}</Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                  {key.revokedAt && ` • Revoked: ${new Date(key.revokedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-muted-foreground text-right text-sm">
                <p>{key.requestCount} requests</p>
                <p>{key.violations} violations</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
