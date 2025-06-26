"use client";

import { Settings, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

interface Collection {
  id?: string;
  title: string;
}

interface ManageModeHeaderProps {
  manageMode: boolean;
  selectedVideos: Set<string>;
  videosLength: number;
  collections: Collection[];
  selectedCollectionId: string | null;
  onManageModeToggle: () => void;
  onExitManageMode: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onVideoAdded: () => void;
}

const ManageModeControls = ({
  selectedVideos,
  videosLength,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  onExitManageMode,
}: {
  selectedVideos: Set<string>;
  videosLength: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onExitManageMode: () => void;
}) => (
  <>
    {selectedVideos.size > 0 && (
      <>
        <span className="text-muted-foreground text-sm">{selectedVideos.size} selected</span>
        <Button variant="outline" size="sm" onClick={onBulkDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </Button>
        <Button variant="outline" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </>
    )}
    {videosLength > 0 && selectedVideos.size !== videosLength && (
      <Button variant="outline" size="sm" onClick={onSelectAll}>
        Select All
      </Button>
    )}
    <Button variant="outline" size="sm" onClick={onExitManageMode}>
      <Settings className="mr-2 h-4 w-4" />
      Exit Manage
    </Button>
  </>
);

const AccountBadge = ({ userRole }: { userRole?: string }) => {
  // Determine account level based on role
  const getAccountLevel = () => {
    switch (userRole) {
      case "super_admin":
        return "Super Admin";
      case "coach":
        return "Pro Account";
      case "creator":
        return "Creator Account";
      default:
        return "Free Account";
    }
  };

  const getAccountVariant = () => {
    switch (userRole) {
      case "super_admin":
        return "default"; // Primary color for super admin
      case "coach":
        return "default"; // Primary color for pro
      case "creator":
        return "secondary"; // Secondary color for creator
      default:
        return "outline"; // Outline for free
    }
  };

  return (
    <Badge variant={getAccountVariant()} className="px-3 py-1">
      {getAccountLevel()}
    </Badge>
  );
};

const AdminControls = ({ onManageModeToggle, userRole }: { onManageModeToggle: () => void; userRole?: string }) => (
  <>
    <Button variant="outline" size="sm" onClick={onManageModeToggle}>
      <Settings className="mr-2 h-4 w-4" />
      Manage
    </Button>
    <AccountBadge userRole={userRole} />
  </>
);

export const ManageModeHeader = ({
  manageMode,
  selectedVideos,
  videosLength,
  onManageModeToggle,
  onExitManageMode,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
}: ManageModeHeaderProps) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";
  const isCreator = userProfile?.role === "creator";

  if (manageMode && isAdmin) {
    return (
      <ManageModeControls
        selectedVideos={selectedVideos}
        videosLength={videosLength}
        onBulkDelete={onBulkDelete}
        onClearSelection={onClearSelection}
        onSelectAll={onSelectAll}
        onExitManageMode={onExitManageMode}
      />
    );
  }

  if (isCreator) {
    return <AccountBadge userRole={userProfile.role} />;
  }

  if (isAdmin) {
    return <AdminControls onManageModeToggle={onManageModeToggle} userRole={userProfile.role} />;
  }

  return <AccountBadge userRole={userProfile?.role} />;
};
