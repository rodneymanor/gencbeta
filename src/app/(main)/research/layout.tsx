"use client";

import { ReactNode, Suspense } from "react";

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
    <SidebarProvider defaultOpen={false}>
      <SmartSidebarProvider>
        <TopBarProvider>
          <VideoPlaybackProvider>
            <div className="flex h-screen w-full">
              <AppSidebar variant="inset" collapsible="icon" side="left" />
              <SidebarInset className="flex w-screen flex-1">
                <Suspense fallback={<TopBar />}>
                  <RouteAwareTopBar />
                </Suspense>
                <DashboardClientLayout>
                  <div className="hide-scrollbar flex-1 overflow-auto">{children}</div>
                </DashboardClientLayout>
              </SidebarInset>
            </div>
          </VideoPlaybackProvider>
        </TopBarProvider>
      </SmartSidebarProvider>
    </SidebarProvider>
  );
}
