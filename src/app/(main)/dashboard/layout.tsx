"use client";

import { ReactNode, Suspense } from "react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { RouteAwareTopBar } from "@/components/ui/route-aware-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBarProvider } from "@/contexts/topbar-context";
import { VoiceProvider } from "@/contexts/voice-context";

import DashboardClientLayout from "./dashboard-client-layout";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SidebarProvider defaultOpen={false}>
      <SmartSidebarProvider>
        <VoiceProvider>
          <TopBarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar variant="inset" collapsible="icon" side="left" />
              <SidebarInset className="flex w-screen flex-1">
                {/* Flexible Top Bar wrapped in Suspense to avoid build errors when using useSearchParams */}
                <Suspense fallback={null}>
                  <RouteAwareTopBar />
                </Suspense>
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
