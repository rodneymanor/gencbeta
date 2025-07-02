import {
  Home,
  FolderOpen,
  Settings,
  Users,
  ChartLine,
  Trophy,
  Brain,
  Pen,
  WandSparkles,
  Binoculars,
  Bot,
  Wrench,
  Sparkles,
  Chrome,
  type LucideIcon,
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  Mic,
  Video,
  FileText,
  Search,
  Archive,
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
            title: "Scripting",
            url: "/dashboard/scripts/new",
            icon: WandSparkles,
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
      {
        title: "My Brand",
        url: "/dashboard/my-brand",
        icon: Sparkles,
      },
    ],
  },
  {
    id: 2,
    label: "Scripting",
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
            title: "My Custom Voices",
            url: "/dashboard/voices?tab=custom",
            icon: Video,
          },
        ],
      },
    ],
  },
  {
    id: 3,
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
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 4,
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
    id: 5,
    label: "Tools",
    items: [
      {
        title: "Chrome Extension",
        url: "/dashboard/tools/chrome-extension",
        icon: Chrome,
      },
    ],
  },
  {
    id: 6,
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
    id: 7,
    label: "Administration",
    items: [
      {
        title: "User Management",
        url: "/dashboard/admin",
        icon: Settings,
      },
    ],
  },
  {
    id: 8,
    label: "Settings",
    items: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Wrench,
      },
    ],
  },
];

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/dashboard/home",
      icon: Home,
    },
    {
      title: "Scripts",
      url: "/dashboard/scripts",
      icon: FileText,
      items: [
        {
          title: "All Scripts",
          url: "/dashboard/scripts",
        },
        {
          title: "New Script",
          url: "/dashboard/scripts/new",
        },
        {
          title: "Script Editor",
          url: "/dashboard/scripts/editor",
        },
      ],
    },
    {
      title: "Voices",
      url: "/dashboard/voices",
      icon: Mic,
      items: [
        {
          title: "Voice Library",
          url: "/dashboard/voices",
        },
        {
          title: "My Custom Voices",
          url: "/dashboard/voices?tab=custom",
        },
      ],
    },
    {
      title: "Research",
      url: "/dashboard/research",
      icon: Search,
      items: [
        {
          title: "Collections",
          url: "/dashboard/research/collections",
        },
        {
          title: "AI Ideas",
          url: "/dashboard/research/aideas",
        },
      ],
    },
    {
      title: "Capture",
      url: "/dashboard/capture",
      icon: Video,
      items: [
        {
          title: "Voice Notes",
          url: "/dashboard/capture/voice",
        },
        {
          title: "Recordings",
          url: "/dashboard/capture/recordings",
        },
        {
          title: "Notes",
          url: "/dashboard/capture/notes",
        },
      ],
    },
    {
      title: "My Brand",
      url: "/dashboard/my-brand",
      icon: Sparkles,
    },
  ],
  navSecondary: [
    {
      title: "Tools",
      url: "/dashboard/tools",
      icon: Settings2,
      items: [
        {
          title: "Chrome Extension",
          url: "/dashboard/tools/chrome-extension",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    },
    {
      title: "Content Creator",
      url: "/dashboard/content-creator",
      icon: Users,
    },
    {
      title: "Creators",
      url: "/dashboard/creators",
      icon: Users,
    },
    {
      title: "About",
      url: "/dashboard/about",
      icon: Archive,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};
