import { Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HashtagsSectionProps {
  hashtags: string[];
  copyToClipboard: (text: string, fieldName: string) => void;
}

export function HashtagsSection({ hashtags, copyToClipboard }: HashtagsSectionProps) {
  return (
    <div className="bg-card rounded-lg border-2 border-gray-200 p-6 shadow-sm dark:border-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Hashtags</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(hashtags.join(" "), "Hashtags")}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <div className="bg-muted/50 min-h-[60px] rounded-lg border-2 border-gray-200 p-4 dark:border-gray-600">
        <div className="flex flex-wrap gap-2">
          {hashtags.length > 0 ? (
            hashtags.map((hashtag, index) => (
              <Badge key={index} variant="secondary" className="bg-blue-100 text-xs text-blue-800">
                #{hashtag}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No hashtags available</p>
          )}
        </div>
      </div>
    </div>
  );
}
