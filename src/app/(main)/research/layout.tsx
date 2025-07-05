import { ReactNode } from "react";

import { cookies } from "next/headers";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { RouteAwareTopBar } from "@/components/ui/route-aware-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
    <SmartSidebarProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <TopBarProvider>
          <AppSidebar variant={sidebarVariant} collapsible="icon" />
          <SidebarInset
            className={cn(
              contentLayout === "centered" && "!mx-auto max-w-screen-2xl",
              // Adds right margin for inset sidebar in centered layout up to 113rem.
              // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
              "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
            )}
          >
            {/* Flexible Top Bar - Automatically configures based on current route */}
            <RouteAwareTopBar />
            <DashboardClientLayout>
              <VideoPlaybackProvider>
                <div className="p-4 md:p-6">{children}</div>
              </VideoPlaybackProvider>
            </DashboardClientLayout>
          </SidebarInset>
        </TopBarProvider>
      </SidebarProvider>
    </SmartSidebarProvider>
  );
}
