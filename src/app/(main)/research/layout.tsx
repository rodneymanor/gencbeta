import { ReactNode, Suspense } from "react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { RouteAwareTopBar } from "@/components/ui/route-aware-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { TopBarProvider } from "@/contexts/topbar-context";
import { VideoPlaybackProvider } from "@/contexts/video-playback-context";
import { getSidebarVariant, getContentLayout } from "@/lib/layout-preferences";
import { cn } from "@/lib/utils";

import DashboardClientLayout from "../dashboard/dashboard-client-layout";

export default async function ResearchLayout({ children }: Readonly<{ children: ReactNode }>) {
  const sidebarVariant = await getSidebarVariant();
  const contentLayout = await getContentLayout();

  return (
    <SidebarProvider defaultOpen={false}>
      <SmartSidebarProvider>
        <TopBarProvider>
          <VideoPlaybackProvider>
            <div className="flex h-screen w-full">
              <AppSidebar variant={sidebarVariant} collapsible="icon" />
              <SidebarInset
                className={cn(
                  "flex w-screen flex-1",
                  // Override default SidebarInset margins for full-width layout
                  contentLayout === "full-width" && [
                    // Remove all default margins and ensure full width
                    "md:peer-data-[variant=inset]:m-0",
                    "md:peer-data-[variant=inset]:ml-0",
                    "md:peer-data-[variant=inset]:mr-0",
                    "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0",
                    "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-0",
                    // Remove rounded corners and shadow for edge-to-edge appearance
                    "md:peer-data-[variant=inset]:rounded-none",
                    "md:peer-data-[variant=inset]:shadow-none",
                  ],
                )}
              >
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
