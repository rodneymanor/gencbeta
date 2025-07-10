"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Users, UserPlus, Shield, User, Crown, ImageUp, Terminal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { UserManagementService, type UserProfile, type UserRole } from "@/lib/user-management";

import { AssignCreatorDialog } from "./_components/assign-creator-dialog";
import { CreateUserDialog } from "./_components/create-user-dialog";

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [coaches, setCoaches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (userProfile && userProfile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    if (userProfile?.role === "super_admin") {
      loadData();
    }
  }, [user, userProfile, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, allCoaches] = await Promise.all([
        UserManagementService.getAllUsers(),
        UserManagementService.getAllCoaches(),
      ]);
      setUsers(allUsers);
      setCoaches(allCoaches);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = () => {
    loadData();
  };

  const handleCreatorAssigned = () => {
    loadData();
  };

  const handleDeactivateUser = async (uid: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      await UserManagementService.deactivateUser(uid);
      loadData();
    } catch (error) {
      console.error("Error deactivating user:", error);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-4 w-4" />;
      case "coach":
        return <Shield className="h-4 w-4" />;
      case "creator":
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "default";
      case "coach":
        return "secondary";
      case "creator":
        return "outline";
      default:
        return "outline";
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
          {Array.from({ length: 6 }).map((_, i) => (
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

  const coachUsers = users.filter((u) => u.role === "coach");
  const creators = users.filter((u) => u.role === "creator");
  const unassignedCreators = creators.filter((c) => !c.coachId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage coaches, creators, and user assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <AssignCreatorDialog
            coaches={coaches}
            unassignedCreators={unassignedCreators}
            onAssigned={handleCreatorAssigned}
          >
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Assign Creator
            </Button>
          </AssignCreatorDialog>
          <CreateUserDialog onUserCreated={handleUserCreated}>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </CreateUserDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaches</CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creators</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creators.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedCreators.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Users</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.role)}
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-muted-foreground text-sm">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role.replace("_", " ").toUpperCase()}</Badge>
                  {user.role === "creator" && user.coachId && <Badge variant="outline">Assigned to Coach</Badge>}
                  {user.role === "creator" && !user.coachId && <Badge variant="destructive">Unassigned</Badge>}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-muted-foreground text-sm">
                    {user.lastLoginAt
                      ? `Last login: ${new Date(user.lastLoginAt).toLocaleDateString()}`
                      : "Never logged in"}
                  </div>
                  {user.role !== "super_admin" && (
                    <Button variant="outline" size="sm" onClick={() => handleDeactivateUser(user.uid)}>
                      Deactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateUserDialog onUserCreated={handleUserCreated} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Update Thumbnails</CardTitle>
            <ImageUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/thumbnail-updater" passHref>
              <Button variant="outline" className="w-full">
                Go to Thumbnail Tool
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fill Video Insights</CardTitle>
            <Terminal className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/fill-video-insights" passHref>
              <Button variant="outline" className="w-full">
                Go to Insights Tool
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
