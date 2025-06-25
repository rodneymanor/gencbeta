import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ContentSectionsProps {
  description: string;
  transcript: string;
  copyToClipboard: (text: string, fieldName: string) => void;
}

export function ContentSections({ description, transcript, copyToClipboard }: ContentSectionsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Caption */}
      <div className="bg-card rounded-lg border-2 border-gray-200 p-4 shadow-sm dark:border-gray-700">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-semibold">Caption</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(description, "Caption")}
            className="h-8 gap-1 px-2"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className="bg-muted/50 min-h-[100px] rounded-lg border-2 border-gray-200 p-3 dark:border-gray-600">
          <p className="text-xs leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Transcription */}
      <div className="bg-card rounded-lg border-2 border-gray-200 p-4 shadow-sm dark:border-gray-700">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-semibold">Transcription</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(transcript, "Transcription")}
            className="h-8 gap-1 px-2"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className="bg-muted/50 max-h-32 min-h-[100px] overflow-y-auto rounded-lg border-2 border-gray-200 p-3 dark:border-gray-600">
          <p className="text-xs leading-relaxed">{transcript}</p>
        </div>
      </div>
    </div>
  );
}
