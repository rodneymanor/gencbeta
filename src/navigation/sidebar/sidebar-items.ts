import {
  Home,
  FileText,
  Mic,
  StickyNote,
  Sparkles,
  Edit,
  FolderOpen,
  Settings,
  Users,
  ChartPie,
  Grid2X2,
  ChartLine,
  ShoppingBag,
  BookA,
  Forklift,
  Fingerprint,
  Mail,
  MessageSquare,
  Calendar,
  Kanban,
  ReceiptText,
  Lock,
  SquareArrowUpRight,
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
  label: string;
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
          { title: "Content Creator", url: "/dashboard/content-creator", icon: ChartPie },
          { title: "Home", url: "/dashboard/home", icon: Grid2X2 },
          { title: "Analytics", url: "/dashboard/analytics", icon: ChartLine, comingSoon: true },
          { title: "eCommerce", url: "/dashboard/e-commerce", icon: ShoppingBag, comingSoon: true },
          { title: "Academy", url: "/dashboard/academy", icon: BookA, comingSoon: true },
          { title: "Logistics", url: "/dashboard/logistics", icon: Forklift, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Content Library",
    items: [
      {
        title: "Scripts",
        url: "/dashboard/scripts",
        icon: FileText,
        subItems: [
          { title: "All Scripts", url: "/dashboard/scripts", icon: FileText },
          { title: "Script Editor", url: "/dashboard/scripts/editor", icon: Edit },
          { title: "New Script", url: "/dashboard/scripts/new", icon: FileText },
        ],
      },
      {
        title: "Media Capture",
        url: "/dashboard/capture",
        icon: Mic,
        subItems: [
          { title: "Recordings", url: "/dashboard/capture/recordings", icon: Mic },
          { title: "Notes", url: "/dashboard/capture/notes", icon: StickyNote },
          { title: "Voice", url: "/dashboard/capture/voice", icon: Mic },
        ],
      },
      {
        title: "Collections",
        url: "/dashboard/collections",
        icon: FolderOpen,
        subItems: [{ title: "All Videos", url: "/dashboard/collections", icon: FolderOpen }],
      },
    ],
  },
  {
    id: 3,
    label: "Creative Tools",
    items: [
      {
        title: "AI Generation",
        url: "/dashboard/inspiration",
        icon: Sparkles,
        subItems: [{ title: "AI Ideas", url: "/dashboard/inspiration", icon: Sparkles }],
      },
    ],
  },
  {
    id: 4,
    label: "Team & Users",
    items: [
      {
        title: "Authentication",
        url: "/auth",
        icon: Fingerprint,
        subItems: [
          { title: "Login v1", url: "/auth/v1/login", icon: Fingerprint, newTab: true },
          { title: "Register v1", url: "/auth/v1/register", icon: Fingerprint, newTab: true },
        ],
      },
      {
        title: "Team Management",
        url: "/dashboard/creators",
        icon: Users,
        subItems: [{ title: "My Creators", url: "/dashboard/creators", icon: Users }],
      },
      {
        title: "Communication",
        url: "/communication",
        icon: Mail,
        subItems: [
          { title: "Email", url: "/mail", icon: Mail, comingSoon: true },
          { title: "Chat", url: "/chat", icon: MessageSquare, comingSoon: true },
        ],
      },
    ],
  },
  {
    id: 5,
    label: "Organization",
    items: [
      {
        title: "Planning",
        url: "/planning",
        icon: Calendar,
        subItems: [
          { title: "Calendar", url: "/calendar", icon: Calendar, comingSoon: true },
          { title: "Kanban", url: "/kanban", icon: Kanban, comingSoon: true },
        ],
      },
      {
        title: "Business",
        url: "/business",
        icon: ReceiptText,
        subItems: [{ title: "Invoice", url: "/invoice", icon: ReceiptText, comingSoon: true }],
      },
    ],
  },
  {
    id: 6,
    label: "Administration",
    items: [
      {
        title: "User Management",
        url: "/dashboard/admin",
        icon: Settings,
        subItems: [
          { title: "Admin Panel", url: "/dashboard/admin", icon: Settings },
          { title: "Users", url: "/users", icon: Users, comingSoon: true },
          { title: "Roles", url: "/roles", icon: Lock, comingSoon: true },
        ],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        subItems: [
          { title: "General", url: "/settings/general", icon: Settings, comingSoon: true },
          { title: "About", url: "/dashboard/about", icon: SquareArrowUpRight },
        ],
      },
    ],
  },
];
