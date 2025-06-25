"use client";

import withAuthOrDemo from "@/components/auth/with-auth-or-demo";

function CollectionsDemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default withAuthOrDemo(CollectionsDemoLayout);
