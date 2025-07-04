import { ReactNode } from "react";

import { cookies } from "next/headers";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { VideoPlaybackProvider } from "@/contexts/video-playback-context";
import { getSidebarVariant, getSidebarCollapsible, getContentLayout } from "@/lib/layout-preferences";
import { cn } from "@/lib/utils";

import { AccountBadge } from "../dashboard/_components/sidebar/account-badge";
import { NavUser } from "../dashboard/_components/sidebar/nav-user";
import { SearchDialog } from "../dashboard/_components/sidebar/search-dialog";
import { SmartSidebarTrigger } from "../dashboard/_components/sidebar/smart-sidebar-trigger";
import DashboardClientLayout from "../dashboard/dashboard-client-layout";

export default async function ResearchLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();

  // Read sidebar state from cookie with proper fallback
  const sidebarStateCookie = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarStateCookie === "true" || (sidebarStateCookie === undefined && true); // Default to true if no cookie exists

  const sidebarVariant = await getSidebarVariant();
  const sidebarCollapsible = await getSidebarCollapsible();
  const contentLayout = await getContentLayout();

  return (
    <SmartSidebarProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar variant={sidebarVariant} collapsible="icon" />
        <SidebarInset
          className={cn(
            contentLayout === "centered" && "!mx-auto max-w-screen-2xl",
            // Adds right margin for inset sidebar in centered layout up to 113rem.
            // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
            "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
          )}
        >
          <header
            className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SmartSidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <AccountBadge />
                <NavUser />
              </div>
            </div>
          </header>
          <DashboardClientLayout>
            <VideoPlaybackProvider>
              <div className="p-4 md:p-6">{children}</div>
            </VideoPlaybackProvider>
          </DashboardClientLayout>
        </SidebarInset>
      </SidebarProvider>
    </SmartSidebarProvider>
  );
}
