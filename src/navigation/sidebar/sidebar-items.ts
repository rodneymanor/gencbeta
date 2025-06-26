import {
  Home,
  FileText,
  Mic,
  StickyNote,
  Sparkles,
  FolderOpen,
  Settings,
  Users,
  UserPen,
  ChartLine,
  Trophy,
  Brain,
  Pen,
  WandSparkles,
  Binoculars,
  Bot,
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
        title: "Dashboards",
        url: "/dashboard",
        icon: Home,
        subItems: [
          {
            title: "Content Creator",
            url: "/dashboard/content-creator",
            icon: UserPen,
          },
          {
            title: "Analytics",
            url: "/dashboard/analytics",
            icon: ChartLine,
            comingSoon: true,
          },
          {
            title: "Quick Wins",
            url: "/dashboard/quickwins",
            icon: Trophy,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Idea Inbox",
    items: [
      {
        title: "Idea Inbox",
        url: "/ideas",
        icon: Brain,
        subItems: [
          {
            title: "Notes",
            url: "/ideas/notes",
            icon: Pen,
          },
          {
            title: "Scripting",
            url: "/ideas/scripting",
            icon: WandSparkles,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Research",
    items: [
      {
        title: "Research",
        url: "/research",
        icon: Binoculars,
        subItems: [
          {
            title: "Collections",
            url: "/research/collections",
            icon: FolderOpen,
          },
          {
            title: "AI Ideas",
            url: "/research/aideas",
            icon: Bot,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    label: "Team",
    items: [
      {
        title: "My Creators",
        url: "/dashboard/creators",
        icon: Users,
      },
    ],
  },
  {
    id: 5,
    label: "Administration",
    items: [
      {
        title: "User Management",
        url: "/dashboard/admin",
        icon: Settings,
      },
    ],
  },
];
