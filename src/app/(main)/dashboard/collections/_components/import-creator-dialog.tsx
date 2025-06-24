"use client";

import { useState } from "react";

import { Download, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";
import { TikTokApiService, type TikTokVideo } from "@/lib/tiktok-api";

interface ImportCreatorDialogProps {
  children: React.ReactNode;
  collections: Collection[];
  onVideosImported: () => void;
}

export function ImportCreatorDialog({
  children,
  collections,
  onVideosImported,
}: ImportCreatorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedVideos, setFetchedVideos] = useState<TikTokVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"input" | "preview" | "importing">("input");
  const { user } = useAuth();

  const handleFetchVideos = async () => {
    if (!username.trim() || !TikTokApiService.validateUsername(username)) {
      return;
    }

    setIsLoading(true);
    try {
      const cleanedUsername = TikTokApiService.cleanUsername(username.trim());
      const videos = await TikTokApiService.fetchCreatorVideos(cleanedUsername);
      
      setFetchedVideos(videos);
      setSelectedVideos(new Set(videos.map(v => v.id))); // Select all by default
      setStep("preview");
    } catch (error) {
      console.error("Error fetching videos:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoToggle = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleImportVideos = async () => {
    if (!user || !selectedCollection || selectedVideos.size === 0) return;

    setStep("importing");
    setIsLoading(true);

    try {
      const videosToImport = fetchedVideos.filter(video => selectedVideos.has(video.id));
      
      for (const video of videosToImport) {
        await CollectionsService.addVideoToCollection(selectedCollection, {
          url: `https://www.tiktok.com/@${video.author.username}/video/${video.id}`,
          platform: "tiktok",
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          author: video.author.displayName,
          duration: video.duration,
          metadata: {
            likes: video.stats.likes,
            comments: video.stats.comments,
            shares: video.stats.shares,
            views: video.stats.views,
          },
        });
      }

      onVideosImported();
      handleClose();
    } catch (error) {
      console.error("Error importing videos:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setUsername("");
    setSelectedCollection("");
    setFetchedVideos([]);
    setSelectedVideos(new Set());
    setStep("input");
    setIsLoading(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Import TikTok Creator</DialogTitle>
              <DialogDescription>
                Import the latest 10 videos from a TikTok creator
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {step === "input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">TikTok Username</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="adamstewartmarketing"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === "Enter" && handleFetchVideos()}
                    />
                  </div>
                  <Button 
                    onClick={handleFetchVideos}
                    disabled={!username.trim() || isLoading}
                  >
                    {isLoading ? "Fetching..." : "Fetch Videos"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter username without @ symbol (e.g., adamstewartmarketing)
                </p>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Found {fetchedVideos.length} videos</h3>
                  <p className="text-sm text-muted-foreground">
                    Select videos to import ({selectedVideos.size} selected)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedVideos(new Set())}
                  >
                    Deselect All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedVideos(new Set(fetchedVideos.map(v => v.id)))}
                  >
                    Select All
                  </Button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {fetchedVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedVideos.has(video.id) 
                        ? "bg-primary/5 border-primary" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleVideoToggle(video.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(video.id)}
                      onChange={() => handleVideoToggle(video.id)}
                      className="rounded"
                    />
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.title}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>👁 {formatNumber(video.stats.views)}</span>
                        <span>❤️ {formatNumber(video.stats.likes)}</span>
                        <span>💬 {formatNumber(video.stats.comments)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Import to Collection</Label>
                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose collection..." />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => 
                      collection.id ? (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.title}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("input")}>
                  Back
                </Button>
                <Button 
                  onClick={handleImportVideos}
                  disabled={selectedVideos.size === 0 || !selectedCollection}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import {selectedVideos.size} Video{selectedVideos.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="font-medium">Importing videos...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 