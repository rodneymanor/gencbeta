"use client";

import { useState, useEffect } from "react";

import { usePathname } from "next/navigation";

import { Settings, Plus } from "lucide-react";

import { AddVideoDialog } from "@/app/(main)/dashboard/collections/_components/add-video-dialog";
import { CreateCollectionDialog } from "@/app/(main)/dashboard/collections/_components/create-collection-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsRBACService, type Collection } from "@/lib/collections";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";
import { setValueToCookie } from "@/server/server-actions";

// Import collection components

type LayoutControlsProps = {
  readonly variant: SidebarVariant;
  readonly collapsible: SidebarCollapsible;
  readonly contentLayout: ContentLayout;
};

export function LayoutControls({ variant, collapsible, contentLayout }: LayoutControlsProps) {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if we're on collections page and user has appropriate permissions
  const isCollectionsPage = pathname ? pathname.includes("/collections") : false;
  const canManageCollections = userProfile?.role === "coach" || userProfile?.role === "super_admin";
  const showCollectionControls = isCollectionsPage && canManageCollections;

  // Load collections when needed
  useEffect(() => {
    const loadCollections = async () => {
      if (!showCollectionControls || !user) return;

      setLoading(true);
      try {
        const userCollections = await CollectionsRBACService.getUserCollections(user.uid);
        setCollections(userCollections);
      } catch (error) {
        console.error("Error loading collections:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [showCollectionControls, user]);

  const handleValueChange = async (key: string, value: string) => {
    await setValueToCookie(key, value);
  };

  const handleVideoAdded = () => {
    // Trigger a page refresh or emit an event to refresh the collections page
    window.location.reload();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon">
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="text-sm leading-none font-medium">Settings</h4>
            <p className="text-muted-foreground text-xs">Customize your dashboard layout and manage content.</p>
          </div>

          {/* Collection Controls Section */}
          {showCollectionControls && (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <h5 className="text-xs font-medium">Content Management</h5>
                  <p className="text-muted-foreground text-xs">Add videos and create collections.</p>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-2">
                    <div className="bg-muted h-8 w-full animate-pulse rounded" />
                    <div className="bg-muted h-8 w-full animate-pulse rounded" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <AddVideoDialog
                      collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
                      selectedCollectionId={undefined}
                      onVideoAdded={handleVideoAdded}
                    />

                    <CreateCollectionDialog onCollectionCreated={handleVideoAdded}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Collection
                      </Button>
                    </CreateCollectionDialog>
                  </div>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Layout Settings Section */}
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <h5 className="text-xs font-medium">Layout Settings</h5>
              <p className="text-muted-foreground text-xs">Customize your dashboard layout preferences.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Sidebar Variant</Label>
                <ToggleGroup
                  className="w-full"
                  size="sm"
                  variant="outline"
                  type="single"
                  value={variant}
                  onValueChange={(value) => handleValueChange("sidebar_variant", value)}
                >
                  <ToggleGroupItem className="text-xs" value="inset" aria-label="Toggle inset">
                    Inset
                  </ToggleGroupItem>
                  <ToggleGroupItem className="text-xs" value="sidebar" aria-label="Toggle sidebar">
                    Sidebar
                  </ToggleGroupItem>
                  <ToggleGroupItem className="text-xs" value="floating" aria-label="Toggle floating">
                    Floating
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Sidebar Collapsible</Label>
                <ToggleGroup
                  className="w-full"
                  size="sm"
                  variant="outline"
                  type="single"
                  value={collapsible}
                  onValueChange={(value) => handleValueChange("sidebar_collapsible", value)}
                >
                  <ToggleGroupItem className="text-xs" value="icon" aria-label="Toggle icon">
                    Icon
                  </ToggleGroupItem>
                  <ToggleGroupItem className="text-xs" value="offcanvas" aria-label="Toggle offcanvas">
                    OffCanvas
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Content Layout</Label>
                <ToggleGroup
                  className="w-full"
                  size="sm"
                  variant="outline"
                  type="single"
                  value={contentLayout}
                  onValueChange={(value) => handleValueChange("content_layout", value)}
                >
                  <ToggleGroupItem className="text-xs" value="centered" aria-label="Toggle centered">
                    Centered
                  </ToggleGroupItem>
                  <ToggleGroupItem className="text-xs" value="full-width" aria-label="Toggle full-width">
                    Full Width
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
