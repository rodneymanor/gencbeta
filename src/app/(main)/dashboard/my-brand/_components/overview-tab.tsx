"use client";

import { formatDistanceToNow } from "date-fns";
import { User, Target, Hash, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BrandProfile } from "@/types/brand-profile";

interface OverviewTabProps {
  profile: BrandProfile | null | undefined;
}

export function OverviewTab({ profile }: OverviewTabProps) {
  if (!profile) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center text-center">
          <div className="space-y-3">
            <Sparkles className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h3 className="text-lg font-semibold">No Brand Profile Yet</h3>
              <p className="text-muted-foreground text-sm">
                Complete the Questions tab to generate your personalized brand profile
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { questionnaire, profile: profileData, createdAt, version } = profile;

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Brand Profile Overview
              </CardTitle>
              <CardDescription>Your personalized brand identity and strategy</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-sm">Version {version}</div>
              <div className="text-muted-foreground text-xs">
                Created {formatDistanceToNow(new Date(createdAt))} ago
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Focus */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Target className="h-4 w-4" />
              Business Focus
            </h3>
            <p className="text-muted-foreground">{questionnaire.profession}</p>
          </div>

          <Separator />

          {/* Brand Personality */}
          <div>
            <h3 className="mb-2 font-semibold">Brand Personality</h3>
            <p className="text-muted-foreground">{questionnaire.brandPersonality}</p>
          </div>
        </CardContent>
      </Card>

      {/* Content Pillars Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Content Pillars ({profileData.content_pillars.length})
          </CardTitle>
          <CardDescription>Your core content themes for consistent messaging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profileData.content_pillars.slice(0, 6).map((pillar, index) => (
              <div key={index} className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">{pillar.pillar_name}</h4>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{pillar.description}</p>
              </div>
            ))}
          </div>
          {profileData.content_pillars.length > 6 && (
            <p className="text-muted-foreground mt-3 text-sm">+{profileData.content_pillars.length - 6} more pillars</p>
          )}
        </CardContent>
      </Card>

      {/* Keywords Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Keywords Overview
          </CardTitle>
          <CardDescription>Your strategic keywords for content optimization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Core Keywords */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Core Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {profileData.core_keywords.slice(0, 8).map((keyword, index) => (
                <Badge key={index} variant="default" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {profileData.core_keywords.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{profileData.core_keywords.length - 8} more
                </Badge>
              )}
            </div>
          </div>

          {/* Audience Keywords */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Audience Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {profileData.audience_keywords.slice(0, 6).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {profileData.audience_keywords.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{profileData.audience_keywords.length - 6} more
                </Badge>
              )}
            </div>
          </div>

          {/* Hashtags Preview */}
          {profileData.suggested_hashtags && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Suggested Hashtags</h4>
              <div className="flex flex-wrap gap-1">
                {profileData.suggested_hashtags.broad.slice(0, 4).map((hashtag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{hashtag}
                  </Badge>
                ))}
                {profileData.suggested_hashtags.niche.slice(0, 3).map((hashtag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{hashtag}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  +more hashtags
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
