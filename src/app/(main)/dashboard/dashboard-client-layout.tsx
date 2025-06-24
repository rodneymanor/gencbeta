"use client";

import withAuth from "@/components/auth/with-auth";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default withAuth(DashboardLayout);
