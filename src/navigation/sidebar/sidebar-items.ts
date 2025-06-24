import { Home, FileText, Mic, StickyNote, Sparkles, Edit, FolderOpen, type LucideIcon } from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
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
    items: [
      {
        title: "Home",
        url: "/dashboard/content-creator",
        icon: Home,
      },
    ],
  },
  {
    id: 2,
    label: "Library",
    items: [
      {
        title: "Scripts",
        url: "/dashboard/scripts",
        icon: FileText,
      },
      {
        title: "Recordings",
        url: "/dashboard/capture/recordings",
        icon: Mic,
      },
      {
        title: "Notes",
        url: "/dashboard/capture/notes",
        icon: StickyNote,
      },
    ],
  },
  {
    id: 3,
    label: "Inspiration",
    items: [
      {
        title: "AI Ideas",
        url: "/dashboard/inspiration",
        icon: Sparkles,
      },
    ],
  },
  {
    id: 4,
    label: "Collections",
    items: [
      {
        title: "All Videos",
        url: "/dashboard/collections",
        icon: FolderOpen,
      },
    ],
  },
  {
    id: 5,
    label: "Tools",
    items: [
      {
        title: "Script Editor",
        url: "/dashboard/scripts/editor",
        icon: Edit,
      },
    ],
  },
];
