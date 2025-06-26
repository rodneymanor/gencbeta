import { Lightbulb, Shuffle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HookDetailsSectionProps {
  hook: string;
}

export function HookDetailsSection({ hook }: HookDetailsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Hook Details Card */}
      <div className="bg-card rounded-lg border-2 border-gray-200 p-6 shadow-sm dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold">Hook Details</h3>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm font-medium">Hook:</Label>
            <div className="bg-muted/50 mt-2 rounded-lg border-2 border-gray-200 p-4 dark:border-gray-600">
              <p className="text-sm leading-relaxed">{hook}</p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm font-medium">Hook Type:</Label>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Curiosity Spike
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm font-medium">Enter topic</Label>
            <Input
              placeholder="Enter topic"
              className="mt-2 border-2 border-gray-300 focus:border-blue-500 dark:border-gray-600"
            />
          </div>

          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
            <Shuffle className="mr-2 h-4 w-4" />
            Remix Hook
          </Button>
        </div>
      </div>

      {/* Remix Idea Section */}
      <div className="bg-card rounded-lg border-2 border-gray-200 p-6 shadow-sm dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold">Remix Idea</h3>
        <div className="bg-muted/50 flex min-h-[120px] items-center justify-center rounded-lg border-2 border-gray-200 p-4 dark:border-gray-600">
          <div className="space-y-2 text-center">
            <Lightbulb className="mx-auto h-8 w-8 text-blue-600" />
            <p className="text-muted-foreground text-sm">Brainstorm similar ideas based on your brand</p>
            <Button variant="outline" size="sm" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Generate Ideas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
