"use client";

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Sparkles, Edit, RotateCcw, History, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BrandProfileService } from "@/lib/brand-profile";
import type { BrandProfile } from "@/types/brand-profile";

import { BrandOnboardingDialog } from "./brand-onboarding-dialog";

interface BrandProfileManagerProps {
  trigger: React.ReactNode;
}

export function BrandProfileManager({ trigger }: BrandProfileManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["brand-profiles"],
    queryFn: () => BrandProfileService.fetchBrandProfiles(),
    enabled: isOpen,
  });

  const activateProfileMutation = useMutation({
    mutationFn: (profileId: string) => BrandProfileService.activateBrandProfile(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
      toast.success("Profile activated successfully");
    },
    onError: (error) => {
      toast.error("Failed to activate profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (profileId: string) => BrandProfileService.deleteBrandProfile(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
      toast.success("Profile deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const activeProfile = data?.activeProfile;
  const profiles = data?.profiles ?? [];

  const handleRetakeQuestionnaire = () => {
    setShowOnboarding(true);
    setIsOpen(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
    toast.success("New brand profile created!");
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <div className="flex h-64 items-center justify-center">
            <Sparkles className="text-primary h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <div className="text-muted-foreground flex h-64 items-center justify-center">
            <AlertCircle className="mr-2 h-8 w-8" />
            Failed to load brand profiles
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              Brand Profile Manager
            </DialogTitle>
            <DialogDescription>Manage your brand profiles and create new profiles.</DialogDescription>
          </DialogHeader>

          <div className="grid h-[70vh] grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Active Profile */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Profile</h3>
                <div className="flex gap-2">
                  <Button onClick={handleRetakeQuestionnaire} variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-60px)]">
                {activeProfile ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Overview</CardTitle>
                        <CardDescription>
                          Created {formatDistanceToNow(new Date(activeProfile.createdAt))} ago
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="mb-2 font-medium">Content Pillars</h4>
                          <div className="flex flex-wrap gap-2">
                            {activeProfile.profile.content_pillars.map((pillar, index) => (
                              <Badge key={index} variant="secondary">
                                {pillar.pillar_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="mb-2 font-medium">Core Keywords</h4>
                          <div className="flex flex-wrap gap-1">
                            {activeProfile.profile.core_keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="mb-2 font-medium">Business Focus</h4>
                          <p className="text-muted-foreground text-sm">{activeProfile.questionnaire.profession}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex h-64 flex-col items-center justify-center text-center">
                      <Sparkles className="text-muted-foreground mb-4 h-12 w-12" />
                      <h3 className="mb-2 text-lg font-semibold">No Active Profile</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first brand profile to get started with personalized content strategy.
                      </p>
                      <Button onClick={handleRetakeQuestionnaire}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Profile
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            </div>

            {/* Profile History */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <History className="h-5 w-5" />
                Profile History
              </h3>

              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <Card key={profile.id} className={profile.isActive ? "ring-primary ring-2" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            {profile.isActive && <CheckCircle2 className="text-primary h-4 w-4" />}
                            Version {profile.version}
                          </CardTitle>
                          <div className="flex gap-1">
                            {!profile.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => activateProfileMutation.mutate(profile.id)}
                                disabled={activateProfileMutation.isPending}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProfileMutation.mutate(profile.id)}
                              disabled={deleteProfileMutation.isPending || profile.isActive}
                              className="text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(profile.createdAt))} ago
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground line-clamp-2 text-xs">{profile.questionnaire.profession}</p>
                      </CardContent>
                    </Card>
                  ))}

                  {profiles.length === 0 && (
                    <div className="text-muted-foreground py-8 text-center text-sm">No profiles yet</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BrandOnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
