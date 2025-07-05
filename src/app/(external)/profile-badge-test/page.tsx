"use client";

import { ProfileWithBadge } from "@/components/ui/profile-with-badge";

export default function ProfileBadgeTestPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Profile with Badge Showcase</h1>
        <p className="text-muted-foreground text-lg">
          Profile icons with superimposed account level badges, positioned at the bottom-right
        </p>
      </div>

      {/* Size Variants */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Size Variants</h2>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <ProfileWithBadge size="sm" />
              <span className="text-muted-foreground text-sm">Small (32px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProfileWithBadge size="md" />
              <span className="text-muted-foreground text-sm">Medium (40px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProfileWithBadge size="lg" />
              <span className="text-muted-foreground text-sm">Large (48px)</span>
            </div>
          </div>
        </div>

        {/* With and Without Badge */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Badge Options</h2>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <ProfileWithBadge size="md" showBadge={true} />
              <span className="text-muted-foreground text-sm">With Badge</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProfileWithBadge size="md" showBadge={false} />
              <span className="text-muted-foreground text-sm">Without Badge</span>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Usage Examples</h2>

          {/* In Navigation */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Navigation Bar</h3>
            <div className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">John Doe</span>
                <ProfileWithBadge size="sm" />
              </div>
            </div>
          </div>

          {/* In Sidebar */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Sidebar User Menu</h3>
            <div className="w-64 rounded-lg border bg-white p-4">
              <div className="flex items-center gap-3">
                <ProfileWithBadge size="md" />
                <div className="flex-1">
                  <div className="font-medium">John Doe</div>
                  <div className="text-muted-foreground text-sm">john@example.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* In User Card */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">User Card</h3>
            <div className="max-w-sm rounded-lg border bg-white p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <ProfileWithBadge size="lg" />
                <div>
                  <div className="font-semibold">John Doe</div>
                  <div className="text-muted-foreground text-sm">Premium Member</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Design Notes */}
        <div className="bg-muted/50 rounded-lg border p-6">
          <h3 className="mb-3 text-lg font-medium">Design Notes</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>• Badge is positioned at bottom-right corner of profile icon</li>
            <li>• Pro accounts get a golden gradient badge with crown icon</li>
            <li>• Free accounts get a gray badge with user icon</li>
            <li>• Badge has white border to separate from profile background</li>
            <li>• Loading state shows animated dot while auth is initializing</li>
            <li>• Component is responsive with three size variants</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
