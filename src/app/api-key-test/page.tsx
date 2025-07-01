"use client";

import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Eye, EyeOff, Key, Trash2, TestTube } from "lucide-react";

interface ApiKeyInfo {
  keyId: string;
  status: "active" | "disabled";
  createdAt: string;
  lastUsed?: string;
  requestCount: number;
  violations: number;
  lockoutUntil?: string;
  revokedAt?: string;
}

interface ApiKeyStatus {
  hasActiveKey: boolean;
  activeKey?: ApiKeyInfo;
  keyHistory: ApiKeyInfo[];
  limits: {
    requestsPerMinute: number;
    violationLockoutHours: number;
    maxViolationsBeforeLockout: number;
  };
}

export default function ApiKeyTestPage() {
  const [user] = useAuthState(auth);
  const [apiKey, setApiKey] = useState<string>("");
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Test endpoints
  const [testUrl, setTestUrl] = useState("https://www.tiktok.com/@example/video/12345");
  const [testCollectionId, setTestCollectionId] = useState("");

  useEffect(() => {
    if (user) {
      fetchKeyStatus();
    }
  }, [user]);

  const getIdToken = async () => {
    if (!user) throw new Error("User not authenticated");
    return await user.getIdToken();
  };

  const fetchKeyStatus = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      
      const response = await fetch("/api/keys", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKeyStatus(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch key status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const token = await getIdToken();
      
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setApiKey(data.apiKey);
        setSuccess(data.message);
        await fetchKeyStatus();
      } else {
        setError(data.message || "Failed to generate API key");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const token = await getIdToken();
      
      const response = await fetch("/api/keys", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message);
        setApiKey("");
        await fetchKeyStatus();
      } else {
        setError(data.message || "Failed to revoke API key");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const testApiEndpoint = async (endpoint: string, testData: any) => {
    try {
      setLoading(true);
      setError("");
      setTestResult(null);

      const testKey = apiKey || keyStatus?.activeKey?.keyId;
      if (!testKey) {
        setError("No API key available for testing");
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data: result,
      });

      if (response.ok) {
        setSuccess("Test successful!");
      } else {
        setError(`Test failed: ${result.message || result.error}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setLoading(false);
    }
  };

  const testCollections = () => {
    fetch("/api/collections", {
      headers: {
        "x-api-key": apiKey,
      },
    }).then(async (response) => {
      const result = await response.json();
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data: result,
      });
    });
  };

  const testAddVideo = () => {
    testApiEndpoint("/api/add-video-to-collection", {
      videoUrl: testUrl,
      collectionId: testCollectionId,
      title: "Test Video via API Key",
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>API Key Management</CardTitle>
            <CardDescription>Please log in to manage your API keys</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Key Management & Testing</h1>
        <p className="text-muted-foreground mt-2">
          Generate and manage API keys for Chrome extension integration
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage Keys</TabsTrigger>
          <TabsTrigger value="test">Test API</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          {/* Current API Key Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Current API Key Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {keyStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Status: {keyStatus.hasActiveKey ? "Active" : "No Active Key"}</p>
                      {keyStatus.activeKey && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Key ID: {keyStatus.activeKey.keyId}...</p>
                          <p>Created: {new Date(keyStatus.activeKey.createdAt).toLocaleDateString()}</p>
                          <p>Requests: {keyStatus.activeKey.requestCount}</p>
                          <p>Violations: {keyStatus.activeKey.violations}</p>
                        </div>
                      )}
                    </div>
                    <Badge variant={keyStatus.hasActiveKey ? "default" : "secondary"}>
                      {keyStatus.hasActiveKey ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{keyStatus.limits.requestsPerMinute}</p>
                      <p className="text-sm text-muted-foreground">Requests/min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{keyStatus.limits.maxViolationsBeforeLockout}</p>
                      <p className="text-sm text-muted-foreground">Max violations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{keyStatus.limits.violationLockoutHours}h</p>
                      <p className="text-sm text-muted-foreground">Lockout duration</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Loading key status...</p>
              )}
            </CardContent>
          </Card>

          {/* API Key Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
              <CardDescription>
                Generate a secure API key for your Chrome extension. You can only have one active key at a time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKey && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your API Key (save this securely!):</label>
                  <div className="flex gap-2">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-yellow-600">
                    ⚠️ This key will only be shown once. Make sure to copy and store it securely.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={generateApiKey} 
                  disabled={loading || keyStatus?.hasActiveKey}
                >
                  Generate API Key
                </Button>
                
                {keyStatus?.hasActiveKey && (
                  <Button 
                    variant="destructive" 
                    onClick={revokeApiKey} 
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Key
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          {/* API Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test API Endpoints
              </CardTitle>
              <CardDescription>
                Test your API key with the collection and video endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Test Video URL:</label>
                  <Input
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/12345"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Collection ID:</label>
                  <Input
                    value={testCollectionId}
                    onChange={(e) => setTestCollectionId(e.target.value)}
                    placeholder="collection-id-here"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={testCollections} disabled={loading || !apiKey}>
                  Test Collections API
                </Button>
                <Button 
                  onClick={testAddVideo} 
                  disabled={loading || !apiKey || !testCollectionId}
                >
                  Test Add Video API
                </Button>
              </div>

              {testResult && (
                <div className="mt-4">
                  <label className="text-sm font-medium">Test Result:</label>
                  <Textarea
                    value={JSON.stringify(testResult, null, 2)}
                    readOnly
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Chrome Extension Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Add video to collection:</h4>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`POST /api/add-video-to-collection
Content-Type: application/json
x-api-key: ${apiKey || 'your-api-key-here'}

{
  "videoUrl": "https://www.tiktok.com/@user/video/12345",
  "collectionId": "your-collection-id",
  "title": "Optional video title"
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">Get collections:</h4>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`GET /api/collections
x-api-key: ${apiKey || 'your-api-key-here'}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 