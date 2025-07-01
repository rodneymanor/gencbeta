"use client";

import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface HashtagCategoryCardProps {
  title: string;
  description: string;
  hashtags: string[];
  newHashtagValue: string;
  onAddHashtag: () => void;
  onRemoveHashtag: (index: number) => void;
  onNewHashtagChange: (value: string) => void;
}

export function HashtagCategoryCard({
  title,
  description,
  hashtags,
  newHashtagValue,
  onAddHashtag,
  onRemoveHashtag,
  onNewHashtagChange,
}: HashtagCategoryCardProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddHashtag();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Hashtag */}
        <div className="flex gap-2">
          <Input
            value={newHashtagValue}
            onChange={(e) => onNewHashtagChange(e.target.value)}
            placeholder={`Add new ${title.toLowerCase()}...`}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={onAddHashtag} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Existing Hashtags */}
        <div className="flex flex-wrap gap-2">
          {hashtags.map((hashtag, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              #{hashtag}
              <button onClick={() => onRemoveHashtag(index)} className="ml-1 rounded-full p-0.5 hover:bg-white/20">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
