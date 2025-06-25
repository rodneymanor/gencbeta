import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Video } from "@/lib/collections";

interface VideoModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{video?.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {video && (
            <div className="space-y-4">
              <div className="flex aspect-video items-center justify-center rounded-lg bg-black">
                <p className="text-center text-white">
                  Video player would be embedded here
                  <br />
                  <span className="text-sm text-gray-300">URL: {video.url}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Author:</p>
                  <p className="text-muted-foreground">{video.author}</p>
                </div>
                <div>
                  <p className="font-semibold">Platform:</p>
                  <p className="text-muted-foreground capitalize">{video.platform}</p>
                </div>
                <div>
                  <p className="font-semibold">Duration:</p>
                  <p className="text-muted-foreground">{video.duration}s</p>
                </div>
                <div>
                  <p className="font-semibold">Views:</p>
                  <p className="text-muted-foreground">{video.metadata?.views?.toLocaleString() ?? "N/A"}</p>
                </div>
              </div>
              {video.description && (
                <div>
                  <p className="font-semibold">Description:</p>
                  <p className="text-muted-foreground">{video.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
