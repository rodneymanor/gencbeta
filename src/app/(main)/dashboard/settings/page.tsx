"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

import { ApiKeyManagement } from "./_components/api-key-management";
import { KeyHistory } from "./_components/key-history";

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

interface ApiKeyResponse {
  success: boolean;
  hasActiveKey: boolean;
  activeKey?: ApiKeyData;
  keyHistory: ApiKeyData[];
  limits: {
    requestsPerMinute: number;
    violationLockoutHours: number;
    maxViolationsBeforeLockout: number;
  };
}

export default function SettingsPage() {
  const [apiKeyData, setApiKeyData] = useState<ApiKeyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const loadApiKeyData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const idToken = await user.getIdToken();

      const response = await fetch("/api/keys", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiKeyResponse = await response.json();
      setApiKeyData(data);
    } catch (error) {
      console.error("❌ [Settings] Error loading API key data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }
    loadApiKeyData();
  }, [user, router, loadApiKeyData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your API keys and account preferences</p>
      </div>

      {/* API Key Management */}
      <ApiKeyManagement user={user} apiKeyData={apiKeyData} onRefresh={loadApiKeyData} />

      {/* Key History */}
      <KeyHistory keyHistory={apiKeyData?.keyHistory ?? []} />
    </div>
  );
}
