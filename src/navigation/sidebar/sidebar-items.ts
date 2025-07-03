import {
  FolderOpen,
  Settings,
  Users,
  FileText,
  WandSparkles,
  Mic,
  Video,
  Search,
  Archive,
  Sparkles,
  Chrome,
  Wrench,
  Pen,
  Shield,
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
    label: "Create",
    items: [
      {
        title: "Scripts",
        url: "/dashboard/scripts",
        icon: FileText,
        subItems: [
          {
            title: "New Script",
            url: "/dashboard/scripts/new",
            icon: WandSparkles,
          },
          {
            title: "My Scripts",
            url: "/dashboard/scripts",
            icon: Archive,
          },
        ],
      },
      {
        title: "Voices",
        url: "/dashboard/voices",
        icon: Mic,
        subItems: [
          {
            title: "Voice Library",
            url: "/dashboard/voices?tab=library",
            icon: Search,
          },
          {
            title: "Custom Voices",
            url: "/dashboard/voices?tab=custom",
            icon: Video,
          },
          {
            title: "Negative Keywords",
            url: "/dashboard/voices?tab=negative-keywords",
            icon: Shield,
          },
        ],
      },
      {
        title: "My Brand",
        url: "/dashboard/my-brand",
        icon: Sparkles,
      },
    ],
  },
  {
    id: 2,
    label: "Research",
    items: [
      {
        title: "Collections",
        url: "/research/collections",
        icon: FolderOpen,
      },
      {
        title: "Notes",
        url: "/dashboard/capture/notes",
        icon: Pen,
      },
    ],
  },
  {
    id: 3,
    label: "Team",
    items: [
      {
        title: "Creators",
        url: "/dashboard/creators",
        icon: Users,
      },
      {
        title: "Admin",
        url: "/dashboard/admin",
        icon: Settings,
      },
    ],
  },
  {
    id: 4,
    label: "Tools",
    items: [
      {
        title: "Chrome Extension",
        url: "/dashboard/tools/chrome-extension",
        icon: Chrome,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Wrench,
      },
    ],
  },
];
