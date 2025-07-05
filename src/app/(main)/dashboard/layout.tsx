import { ReactNode } from "react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { MinimalHeader } from "@/components/ui/minimal-header";
import { SocialStats } from "@/components/ui/social-stats";
import { VoiceProvider } from "@/contexts/voice-context";

import { AccountBadge } from "./_components/sidebar/account-badge";
import { NavUser } from "./_components/sidebar/nav-user";
import DashboardClientLayout from "./dashboard-client-layout";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <VoiceProvider>
      <div className="min-h-screen bg-background">
        <MinimalHeader
          navigationContent={<AppSidebar />}
        >
          <SocialStats />
          <AccountBadge />
          <NavUser />
        </MinimalHeader>
        
        <main className="center-column">
          <DashboardClientLayout>
            <div className="section">{children}</div>
          </DashboardClientLayout>
        </main>
      </div>
    </VoiceProvider>
  );
}
