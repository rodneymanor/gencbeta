import { ReactNode } from "react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { RouteAwareTopBar } from "@/components/ui/route-aware-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBarProvider } from "@/contexts/topbar-context";
import { VoiceProvider } from "@/contexts/voice-context";
import { getSidebarVariant, getSidebarCollapsible, getContentLayout } from "@/lib/layout-preferences";
import { cn } from "@/lib/utils";

import DashboardClientLayout from "./dashboard-client-layout";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const sidebarVariant = await getSidebarVariant();
  const contentLayout = await getContentLayout();

  return (
    <SidebarProvider>
      <SmartSidebarProvider>
        <VoiceProvider>
          <TopBarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar variant={sidebarVariant} collapsible="icon" />
              <SidebarInset
                className={cn(
                  // V0.dev-like layout: fill entire viewport
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
                {/* Flexible Top Bar - Automatically configures based on current route */}
                <RouteAwareTopBar />
                <DashboardClientLayout>
                  <div className="hide-scrollbar flex-1 overflow-auto p-4 md:p-6">{children}</div>
                </DashboardClientLayout>
              </SidebarInset>
            </div>
          </TopBarProvider>
        </VoiceProvider>
      </SmartSidebarProvider>
    </SidebarProvider>
  );
}
