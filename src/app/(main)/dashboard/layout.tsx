import { ReactNode } from "react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { SmartSidebarProvider } from "@/components/providers/smart-sidebar-provider";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SocialStats } from "@/components/ui/social-stats";
import { getSidebarVariant, getSidebarCollapsible, getContentLayout } from "@/lib/layout-preferences";
import { cn } from "@/lib/utils";

import { AccountBadge } from "./_components/sidebar/account-badge";
import { NavUser } from "./_components/sidebar/nav-user";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { SmartSidebarTrigger } from "./_components/sidebar/smart-sidebar-trigger";
import DashboardClientLayout from "./dashboard-client-layout";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const sidebarVariant = await getSidebarVariant();
  const sidebarCollapsible = await getSidebarCollapsible();
  const contentLayout = await getContentLayout();

  return (
    <SmartSidebarProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar variant={sidebarVariant} collapsible="icon" />
        <SidebarInset
          className={cn(
            // Prevent flexbox shrinking - key fix for full width
            "flex-shrink-0",
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
              // Ensure full height
              "min-h-screen",
            ],
            // Only apply centering and max-width to centered layout
            contentLayout === "centered" && ["mx-auto", "max-w-screen-2xl"],
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SmartSidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <SocialStats />
                <AccountBadge />
                <NavUser layoutSettings={{ contentLayout, variant: sidebarVariant, collapsible: sidebarCollapsible }} />
              </div>
            </div>
          </header>
          <DashboardClientLayout>
            <div
              className={cn(
                // Base classes for all layouts
                "w-full overflow-visible",
                // Centered layout: apply padding, centering, and max-width
                contentLayout === "centered" && "mx-auto max-w-screen-2xl p-4 md:p-6",
                // Full-width layout: no constraints, just height and flex behavior
                contentLayout === "full-width" && "min-h-screen flex-shrink-0",
              )}
            >
              {children}
            </div>
          </DashboardClientLayout>
        </SidebarInset>
      </SidebarProvider>
    </SmartSidebarProvider>
  );
}
