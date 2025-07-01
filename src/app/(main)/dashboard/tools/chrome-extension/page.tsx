"use client";

import { useState } from "react";

import { 
  Chrome, 
  Download, 
  Settings, 
  Key, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Shield,
  HelpCircle,
  ArrowRight,
  Zap
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChromeExtensionPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Chrome className="h-12 w-12 text-blue-600" />
          <h1 className="text-4xl font-bold tracking-tight">Gen.C Video Collector</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Save TikTok and Instagram videos to your collections directly from your browser. 
          No more copying and pasting URLs - just click and collect!
        </p>
        
        {/* Download Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
          <Button size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Download Extension
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Chrome className="h-3 w-3" />
            Chrome 88+ Compatible
          </Badge>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <Download className="h-8 w-8 mx-auto text-blue-600" />
            <CardTitle className="text-lg">Easy Installation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Simple 3-step installation process. No technical knowledge required.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <Zap className="h-8 w-8 mx-auto text-green-600" />
            <CardTitle className="text-lg">One-Click Saving</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Save videos from TikTok and Instagram with a single click.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <Shield className="h-8 w-8 mx-auto text-purple-600" />
            <CardTitle className="text-lg">Secure & Private</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Your data stays secure. Only video URLs are shared, not content.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="installation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="setup">API Setup</TabsTrigger>
          <TabsTrigger value="usage">How to Use</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        {/* Installation Tab */}
        <TabsContent value="installation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Chrome className="h-5 w-5" />
                Installation Guide
              </CardTitle>
              <CardDescription>
                Follow these simple steps to install the Gen.C Video Collector extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Download and Extract</h3>
                    <p className="text-muted-foreground">
                      Download the extension ZIP file and extract it to a folder on your computer. 
                      Remember this location - you'll need it for installation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Enable Developer Mode</h3>
                    <p className="text-muted-foreground">
                      Open Chrome and go to <code className="bg-muted px-2 py-1 rounded">chrome://extensions/</code>
                    </p>
                    <p className="text-muted-foreground">
                      Toggle <strong>"Developer mode"</strong> to ON in the top-right corner.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => copyToClipboard("chrome://extensions/", "extensions")}
                    >
                      {copiedSection === "extensions" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy Extensions URL
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Install the Extension</h3>
                    <p className="text-muted-foreground">
                      Click <strong>"Load unpacked"</strong> and select the folder where you extracted the extension files.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Pin the Extension (Recommended)</h3>
                    <p className="text-muted-foreground">
                      Click the puzzle piece icon (🧩) in Chrome's toolbar, find "Gen.C Video Collector", 
                      and click the pin icon (📌) to keep it visible.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Installation Complete!</strong> The Gen.C Video Collector extension should now appear in your extensions list.
                  Next, set up your API key to start collecting videos.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Setup
              </CardTitle>
              <CardDescription>
                Connect the extension to your Gen.C account with an API key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 1: Generate Your API Key</h3>
                
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Settings className="h-4 w-4" />
                    Navigate to Settings
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                    <li>Click <strong>"Settings"</strong> in the left sidebar (gear icon ⚙️)</li>
                    <li>Scroll down to find the <strong>"API Key Management"</strong> section</li>
                    <li>Click <strong>"Generate API Key"</strong> if you don't have one</li>
                    <li><strong>Copy your API key immediately</strong> - it's only shown once!</li>
                  </ol>
                  
                  <Button asChild variant="outline" className="gap-2">
                    <a href="/dashboard/settings">
                      <Settings className="h-4 w-4" />
                      Go to Settings
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Your API key will only be displayed once when generated. 
                    Copy it immediately and store it securely.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 2: Configure the Extension</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <p className="text-sm">Click the Gen.C Video Collector icon in your Chrome toolbar</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <p className="text-sm">Click <strong>"Open Settings"</strong> when you see "Configuration Required"</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <p className="text-sm">Paste your API key in the text field</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <p className="text-sm">Click <strong>"Test Connection"</strong> to verify it works</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      ✓
                    </div>
                    <p className="text-sm">Click <strong>"Save Settings"</strong> to complete setup</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                How to Use the Extension
              </CardTitle>
              <CardDescription>
                Save videos from TikTok and Instagram with just a few clicks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Supported Platforms</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-pink-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"></div>
                        Instagram
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm space-y-1">
                        <div>✅ Individual posts</div>
                        <div>✅ Reels</div>
                        <div>✅ IGTV videos</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-6 h-6 bg-black rounded-lg"></div>
                        TikTok
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm space-y-1">
                        <div>✅ Individual videos</div>
                        <div>✅ User profile videos</div>
                        <div>✅ For You page videos</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Using the Extension</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Navigate to a Video</h4>
                      <p className="text-muted-foreground">
                        Go to TikTok or Instagram and click on any video. The extension icon will become 
                        <strong> colored/active</strong> when you're on a supported page.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Choose Your Collection</h4>
                      <p className="text-muted-foreground">
                        Click the Gen.C Video Collector icon. You'll see the current video URL and 
                        a list of your available collections.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Save the Video</h4>
                      <p className="text-muted-foreground">
                        Click on the collection where you want to save the video. You'll see a success message: 
                        "Video processing started! Estimated time: 30-60 seconds"
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    The video will be processed in the background and appear in your selected collection within 1-2 minutes.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Troubleshooting & Support
              </CardTitle>
              <CardDescription>
                Common issues and solutions for the Chrome extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Common Issues</h3>
                
                <div className="space-y-4">
                  <Card className="border-amber-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-amber-700">Extension Icon is Grayed Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Cause:</strong> You're not on a supported video page
                      </p>
                      <p className="text-sm">
                        <strong>Solution:</strong> Navigate to a TikTok video or Instagram reel/post. 
                        The icon will become colored when on a supported page.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-red-700">"Invalid API Key" Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Cause:</strong> API key is incorrect, expired, or not set
                      </p>
                      <p className="text-sm">
                        <strong>Solution:</strong> Go to your Settings page and generate a fresh API key, 
                        then update it in the extension settings.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-blue-700">Video Not Appearing in Collection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Cause:</strong> Processing takes time, or there was an error
                      </p>
                      <p className="text-sm">
                        <strong>Solution:</strong> Wait 1-2 minutes, then check your collection. 
                        If still missing, try adding the video again.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Rate Limits</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Requests per minute:</span>
                    <span className="font-medium">60</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Violations before lockout:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Lockout duration:</span>
                    <span className="font-medium">1 hour</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  If you exceed the rate limit, wait for the lockout period to expire before trying again.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Need More Help?</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="gap-2 w-full" asChild>
                    <a href="/dashboard/settings">
                      <Key className="h-4 w-4" />
                      Check API Key Status
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </a>
                  </Button>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>For additional support:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Check the browser console for error messages</li>
                      <li>Verify your API key hasn't been revoked</li>
                      <li>Try refreshing the page and extension</li>
                      <li>Contact support with specific error messages</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Version:</strong> 1.0.0 | <strong>Compatible with:</strong> Chrome 88+ | <strong>Platforms:</strong> TikTok, Instagram
            </p>
            <p className="text-xs text-muted-foreground">
              Your privacy is protected. Only video URLs are shared - no personal data or video content is stored locally.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 