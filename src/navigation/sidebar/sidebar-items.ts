import {
  FolderOpen,
  Settings,
  Users,
  FileText,
  Mic,
  Sparkles,
  Chrome,
  Wrench,
  Pen,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  newTab?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  newTab?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// Placeholder icons for BrandIcon and AdminIcon if not defined elsewhere
const BrandIcon = Sparkles;
const AdminIcon = Settings;

export const sidebarGroups: NavGroup[] = [
  {
    id: 1,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Sparkles,
      },
    ],
  },
  {
    id: 2,
    items: [
      {
        title: "Create",
        url: "/dashboard/scripts",
        icon: FileText,
        subItems: [
          { title: "Scripts", url: "/dashboard/scripts", icon: FileText },
          { title: "Notes", url: "/dashboard/capture/notes", icon: Pen },
        ],
      },
    ],
  },
  {
    id: 3,
    items: [
      {
        title: "Research",
        url: "/research/collections",
        icon: FolderOpen,
        subItems: [
          { title: "Collections", url: "/research/collections", icon: FolderOpen },
        ],
      },
    ],
  },
  {
    id: 4,
    items: [
      {
        title: "Assets",
        url: "/dashboard/voices",
        icon: Mic,
        subItems: [
          { title: "Voices", url: "/dashboard/voices", icon: Mic },
          { title: "My Brand", url: "/dashboard/my-brand", icon: BrandIcon },
          { title: "Creators", url: "/dashboard/creators", icon: Users },
          { title: "Admin", url: "/dashboard/admin", icon: AdminIcon },
        ],
      },
    ],
  },
  {
    id: 5,
    items: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Wrench,
        subItems: [
          { title: "App Settings", url: "/dashboard/settings", icon: Wrench },
          { title: "Chrome Extension", url: "/dashboard/tools/chrome-extension", icon: Chrome },
        ],
      },
    ],
  },
];

// Keep the old export for backward compatibility if needed
export const sidebarItems: NavMainItem[] = sidebarGroups.flatMap(group => group.items);
