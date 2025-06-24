import {
  Home,
  FileText,
  Edit,
  Plus,
  Mic,
  StickyNote,
  Archive,
  Lightbulb,
  BookCopy,
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
    label: "Dashboards",
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
    label: "Scripts",
    items: [
      {
        title: "Scripts Library",
        url: "/dashboard/scripts",
        icon: FileText,
      },
      {
        title: "Script Editor",
        url: "/dashboard/scripts/editor",
        icon: Edit,
      },
      {
        title: "New Script",
        url: "/dashboard/scripts/new",
        icon: Plus,
      },
    ],
  },
  {
    id: 3,
    label: "Content Capture",
    items: [
      {
        title: "Voice Recording",
        url: "/dashboard/capture/voice",
        icon: Mic,
      },
      {
        title: "Notes Capture",
        url: "/dashboard/capture/notes",
        icon: StickyNote,
      },
      {
        title: "Recordings Library",
        url: "/dashboard/capture/recordings",
        icon: Archive,
      },
    ],
  },
  {
    id: 4,
    label: "Inspiration",
    items: [
      {
        title: "Collections",
        url: "/dashboard/collections",
        icon: BookCopy,
      },
      {
        title: "AI Inspiration",
        url: "/dashboard/inspiration",
        icon: Lightbulb,
      },
    ],
  },
];
