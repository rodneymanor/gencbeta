import {
  Home,
  Library,
  FileText,
  Mic,
  StickyNote,
  Lightbulb,
  BookCopy,
  Sparkles,
  Wrench,
  Edit,
  type LucideIcon,
} from "lucide-react";

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
        title: "Collections",
        url: "/dashboard/collections",
        icon: BookCopy,
      },
      {
        title: "AI Ideas",
        url: "/dashboard/inspiration",
        icon: Sparkles,
      },
    ],
  },
  {
    id: 4,
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
