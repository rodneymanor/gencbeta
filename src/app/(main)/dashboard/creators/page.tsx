"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import { User, UserPlus } from "lucide-react";

import { FeatureFlagWrapper } from "@/components/feature-flags/feature-flag-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { UserManagementService, type UserProfile } from "@/lib/user-management";

import { CreateCreatorDialog } from "../../research/collections/_components/create-creator-dialog";

export default function CreatorsPage() {
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const loadCreators = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const coachCreators = await UserManagementService.getCoachCreators(user.uid);
      setCreators(coachCreators);
    } catch (error) {
      console.error("Error loading creators:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (userProfile && userProfile.role !== "coach" && userProfile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    if (userProfile?.role === "coach") {
      loadCreators();
    }
  }, [user, userProfile, router, loadCreators]);

  const handleCreatorCreated = () => {
    loadCreators();
  };

  const handleRemoveCreator = async (creatorUid: string) => {
    if (!confirm("Are you sure you want to remove this creator from your team?")) return;

    try {
      await UserManagementService.removeCreatorFromCoach(creatorUid);
      loadCreators();
    } catch (error) {
      console.error("Error removing creator:", error);
      alert("Failed to remove creator");
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (userProfile.role !== "coach") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Only coaches can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureFlagWrapper flagName="creator_spotlight">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Creators</h1>
            <p className="text-muted-foreground">Manage the creators assigned to you</p>
          </div>
          <CreateCreatorDialog onCreatorCreated={handleCreatorCreated}>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Creator
            </Button>
          </CreateCreatorDialog>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creators.length}</div>
            <p className="text-muted-foreground text-xs">
              {creators.length === 0 ? "No creators assigned" : "Creators on your team"}
            </p>
          </CardContent>
        </Card>

        {/* Creators List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Team Members</h2>
          {creators.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No creators yet</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Create your first creator account to start building your team.
                </p>
                <CreateCreatorDialog onCreatorCreated={handleCreatorCreated}>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create First Creator
                  </Button>
                </CreateCreatorDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {creators.map((creator) => (
                <Card key={creator.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{creator.displayName}</p>
                          <p className="text-muted-foreground text-sm">{creator.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Creator</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-muted-foreground text-sm">
                        {creator.lastLoginAt
                          ? `Last login: ${new Date(creator.lastLoginAt).toLocaleDateString()}`
                          : "Never logged in"}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCreator(creator.uid)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </FeatureFlagWrapper>
  );
}
