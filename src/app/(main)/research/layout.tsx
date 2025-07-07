"use client";

import { ReactNode } from "react";

import { cookies } from "next/headers";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { RouteAwareTopBar } from "@/components/ui/route-aware-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { TopBarProvider } from "@/contexts/topbar-context";
import { VideoPlaybackProvider } from "@/contexts/video-playback-context";
import { getSidebarVariant, getSidebarCollapsible, getContentLayout } from "@/lib/layout-preferences";
import { cn } from "@/lib/utils";

import DashboardClientLayout from "../dashboard/dashboard-client-layout";

export default async function ResearchLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();

  // Read sidebar state from cookie with proper fallback
  const sidebarStateCookie = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarStateCookie === "true" || (sidebarStateCookie === undefined && true); // Default to true if no cookie exists

  const sidebarVariant = await getSidebarVariant();
  const contentLayout = await getContentLayout();

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
