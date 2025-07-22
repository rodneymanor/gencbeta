import React from "react";

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
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

import { HomeIcon, LibraryIcon, ResearchIcon } from "@/components/icons";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon | React.ComponentType<any>;
  newTab?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon | React.ComponentType<any>;
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
    items: [
      {
        title: "Home",
        url: "/dashboard/scripts/new",
        icon: HomeIcon,
        subItems: [
          { title: "Dashboard", url: "/dashboard", icon: HomeIcon },
          { title: "Scripts", url: "/dashboard/scripts", icon: FileText },
          { title: "Notes", url: "/dashboard/notes/", icon: Pen },
          { title: "Voices", url: "/dashboard/voices", icon: Mic },
          { title: "My Brand", url: "/dashboard/my-brand", icon: Sparkles },
          { title: "Creators", url: "/dashboard/creators", icon: Users },
          { title: "Settings", url: "/dashboard/settings", icon: Wrench },
          { title: "Chrome Extension", url: "/dashboard/tools/chrome-extension", icon: Chrome },
          { title: "Script Test (V2)", url: "/dashboard/test/script-generation", icon: FlaskConical },
          { title: "Admin", url: "/dashboard/admin", icon: Settings },
        ],
      },
    ],
  },
  {
    id: 2,
    items: [
      {
        title: "Library",
        url: "/dashboard/scripts/editor",
        icon: LibraryIcon,
        subItems: [
          { title: "Scripts", url: "/dashboard/scripts", icon: FileText },
          { title: "Notes", url: "/dashboard/notes", icon: Pen },
          { title: "Ghost Writer Library", url: "/dashboard/ghost-writer/library", icon: LibraryIcon },
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
        icon: ResearchIcon,
        subItems: [{ title: "Collections", url: "/research/collections", icon: FolderOpen }],
      },
    ],
  },
];
