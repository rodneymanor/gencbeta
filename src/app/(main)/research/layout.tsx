"use client";

import { ReactNode } from "react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { RouteAwareTopBar } from "@/components/ui/route-aware-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { TopBarProvider } from "@/contexts/topbar-context";
import { VideoPlaybackProvider } from "@/contexts/video-playback-context";
import { cn } from "@/lib/utils";

import DashboardClientLayout from "../dashboard/dashboard-client-layout";

export default function ResearchLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <TopBarProvider>
      <div className="flex h-full">
        <main className="flex-1 overflow-y-auto">
          <TopBar />
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </TopBarProvider>
  );
}
