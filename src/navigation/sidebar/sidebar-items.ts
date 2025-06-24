import {
  Home,
  ChartPie,
  Grid2X2,
  ChartLine,
  ShoppingBag,
  BookA,
  Forklift,
  Mail,
  MessageSquare,
  Calendar,
  Kanban,
  ReceiptText,
  Users,
  Lock,
  Fingerprint,
  SquareArrowUpRight,
  PenTool,
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
        title: "Dashboards",
        url: "/dashboard",
        icon: Home,
        subItems: [
          { title: "Default", url: "/dashboard/default", icon: ChartPie },
          { title: "Home", url: "/dashboard/home", icon: Home },
          { title: "Content Creator", url: "/dashboard/content-creator", icon: PenTool },
          { title: "CRM", url: "/dashboard", icon: Grid2X2, comingSoon: true },
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
  {
    id: 5,
    label: "Pages",
    items: [
      {
        title: "Authentication",
        url: "/auth",
        icon: Fingerprint,
        subItems: [
          { title: "Login v1", url: "/auth/v1/login", newTab: true },
          { title: "Register v1", url: "/auth/v1/register", newTab: true },
        ],
      },
      {
        title: "Email",
        url: "/mail",
        icon: Mail,
        comingSoon: true,
      },
      {
        title: "Chat",
        url: "/chat",
        icon: MessageSquare,
        comingSoon: true,
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: Calendar,
        comingSoon: true,
      },
      {
        title: "Kanban",
        url: "/kanban",
        icon: Kanban,
        comingSoon: true,
      },
      {
        title: "Invoice",
        url: "/invoice",
        icon: ReceiptText,
        comingSoon: true,
      },
      {
        title: "Users",
        url: "/users",
        icon: Users,
        comingSoon: true,
      },
      {
        title: "Roles",
        url: "/roles",
        icon: Lock,
        comingSoon: true,
      },
    ],
  },
  {
    id: 6,
    label: "Misc",
    items: [
      {
        title: "Others",
        url: "/others",
        icon: SquareArrowUpRight,
        comingSoon: true,
      },
    ],
  },
];
