"use client";

import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface KeywordCategoryCardProps {
  title: string;
  description: string;
  keywords: string[];
  newKeywordValue: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  onAddKeyword: () => void;
  onRemoveKeyword: (index: number) => void;
  onNewKeywordChange: (value: string) => void;
}

export function KeywordCategoryCard({
  title,
  description,
  keywords,
  newKeywordValue,
  variant,
  onAddKeyword,
  onRemoveKeyword,
  onNewKeywordChange,
}: KeywordCategoryCardProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddKeyword();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Keyword */}
        <div className="flex gap-2">
          <Input
            value={newKeywordValue}
            onChange={(e) => onNewKeywordChange(e.target.value)}
            placeholder={`Add new ${title.toLowerCase()}...`}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={onAddKeyword} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Existing Keywords */}
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Badge key={index} variant={variant} className="flex items-center gap-1">
              {keyword}
              <button onClick={() => onRemoveKeyword(index)} className="ml-1 rounded-full p-0.5 hover:bg-white/20">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
