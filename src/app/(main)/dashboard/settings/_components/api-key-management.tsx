"use client";

import { useState } from "react";

import type { User } from "firebase/auth";
import { Key, Copy, Trash2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface GenerateKeyResponse {
  success: boolean;
  apiKey: string;
  message: string;
  warning: string;
  metadata: {
    keyId: string;
    createdAt: string;
    rateLimit: string;
    violations: string;
  };
}

interface ApiKeyManagementProps {
  user: User;
  apiKeyData: ApiKeyResponse | null;
  onRefresh: () => void;
}

function NewApiKeyAlert({
  newApiKey,
  onCopy,
  onDismiss,
}: {
  newApiKey: string;
  onCopy: (text: string) => void;
  onDismiss: () => void;
}) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">Your new API key has been generated!</p>
          <p className="text-muted-foreground mt-1 text-sm">
            This key will only be shown once. Please copy it now and store it securely.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Input value={newApiKey} readOnly className="font-mono text-sm" />
            <Button size="sm" variant="outline" onClick={() => onCopy(newApiKey)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss} className="ml-4">
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function ActiveKeyInfo({ activeKey }: { activeKey: ApiKeyData }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Active API Key</h3>
          <p className="text-muted-foreground text-sm">Key ID: {activeKey.keyId}</p>
        </div>
        <Badge variant="outline" className="border-green-200 text-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          Active
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Created</Label>
          <p className="text-sm">
            {activeKey.createdAt ? new Date(activeKey.createdAt).toLocaleDateString() : "Unknown"}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Last Used</Label>
          <p className="text-sm">{activeKey.lastUsed ? new Date(activeKey.lastUsed).toLocaleDateString() : "Never"}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Requests</Label>
          <p className="text-sm">{activeKey.requestCount ?? 0}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Violations</Label>
          <p className="text-sm">{activeKey.violations ?? 0}</p>
        </div>
      </div>
      {activeKey.lockoutUntil && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Rate Limit Lockout Active</p>
            <p className="text-sm">Your API key is locked until {new Date(activeKey.lockoutUntil).toLocaleString()}</p>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

function NoKeyStatus({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div className="space-y-4 text-center">
      <div className="space-y-2">
        <Key className="text-muted-foreground mx-auto h-12 w-12" />
        <h3 className="font-medium">No API Key</h3>
        <p className="text-muted-foreground text-sm">Generate an API key to use with your Chrome extension</p>
      </div>
      <Button onClick={onGenerate} disabled={generating} variant="outline" className="w-full">
        {generating ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Key className="mr-2 h-4 w-4" />
            Generate API Key
          </>
        )}
      </Button>
    </div>
  );
}

export function ApiKeyManagement({ user, apiKeyData, onRefresh }: ApiKeyManagementProps) {
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const generateApiKey = async () => {
    try {
      setGenerating(true);
      const idToken = await user.getIdToken();

      // Debug: Check if we have a valid token
      console.log("🔍 [Debug] ID Token length:", idToken?.length);
      console.log("🔍 [Debug] ID Token starts with:", idToken?.substring(0, 20) + "...");

      if (!idToken) {
        throw new Error("No authentication token available. Please refresh and try again.");
      }

      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerateKeyResponse = await response.json();

      // Debug: Log the full response to see what we received
      console.log("🔍 [Debug] Full API response:", data);
      console.log("🔍 [Debug] API Key from response:", data.apiKey);
      console.log("🔍 [Debug] API Key length:", data.apiKey?.length);
      console.log("🔍 [Debug] API Key starts with:", data.apiKey?.substring(0, 20) + "...");

      setNewApiKey(data.apiKey);
      console.log("🔍 [Debug] Set newApiKey state to:", data.apiKey);

      toast.success("API key generated successfully!");
      // Don't refresh immediately - let user see and copy the key first
      // onRefresh will be called when they dismiss the alert
    } catch (error) {
      console.error("❌ [Settings] Error generating API key:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };

  const revokeApiKey = async () => {
    if (!confirm("Are you sure you want to revoke your API key? This action cannot be undone.")) {
      return;
    }

    try {
      setRevoking(true);
      const idToken = await user.getIdToken();

      if (!idToken) {
        throw new Error("No authentication token available. Please refresh and try again.");
      }

      const response = await fetch("/api/keys", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success("API key revoked successfully");
      setNewApiKey(null);
      onRefresh();
    } catch (error) {
      console.error("❌ [Settings] Error revoking API key:", error);
      toast.error("Failed to revoke API key");
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("API key copied to clipboard!");
    } catch (error) {
      console.error("❌ [Settings] Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <>
      {newApiKey && (
        <NewApiKeyAlert
          newApiKey={newApiKey}
          onCopy={copyToClipboard}
          onDismiss={() => {
            setNewApiKey(null);
            onRefresh(); // Refresh data after user dismisses the alert
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>Generate and manage API keys for Chrome extension integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {apiKeyData?.hasActiveKey && apiKeyData.activeKey ? (
            <div className="space-y-4">
              <ActiveKeyInfo activeKey={apiKeyData.activeKey} />
              <Button variant="destructive" onClick={revokeApiKey} disabled={revoking} className="w-full">
                {revoking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revoke API Key
                  </>
                )}
              </Button>
            </div>
          ) : (
            <NoKeyStatus onGenerate={generateApiKey} generating={generating} />
          )}

          {apiKeyData?.limits && (
            <div className="bg-muted/50 space-y-2 rounded-lg p-4">
              <h4 className="text-sm font-medium">Rate Limits</h4>
              <div className="text-muted-foreground grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Requests per minute:</span>
                  <span>{apiKeyData.limits.requestsPerMinute}</span>
                </div>
                <div className="flex justify-between">
                  <span>Violations before lockout:</span>
                  <span>{apiKeyData.limits.maxViolationsBeforeLockout}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lockout duration:</span>
                  <span>{apiKeyData.limits.violationLockoutHours} hour(s)</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
