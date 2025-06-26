"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

// Prevent static generation to avoid CSS prerendering issues
export const dynamic = "force-dynamic";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/content-creator");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Redirecting...</h1>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
