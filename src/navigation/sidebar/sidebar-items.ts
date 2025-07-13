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
  Home,
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

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [{ title: "Home", url: "/dashboard", icon: Home }],
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
        subItems: [{ title: "Collections", url: "/research/collections", icon: FolderOpen }],
      },
    ],
  },
  {
    id: 4,
    items: [
      {
        title: "Brand",
        url: "/dashboard/voices",
        icon: Mic,
        subItems: [
          { title: "Voices", url: "/dashboard/voices", icon: Mic },
          { title: "My Brand", url: "/dashboard/my-brand", icon: Sparkles },
          { title: "Creators", url: "/dashboard/creators", icon: Users },
          { title: "Admin", url: "/dashboard/admin", icon: Settings },
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
