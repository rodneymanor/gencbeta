"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";

export default function withAuthOrDemo<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const WithAuthOrDemoComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [allowDemo, setAllowDemo] = useState(false);

    // Check if demo mode is explicitly requested
    const demoParam = searchParams.get("demo");
    const isDemoRequested = demoParam === "true";

    useEffect(() => {
      if (!loading) {
        if (user) {
          // User is authenticated, proceed normally
          setAllowDemo(false);
        } else if (isDemoRequested) {
          // Demo mode explicitly requested
          setAllowDemo(true);
        } else {
          // Not authenticated and no demo requested, redirect to login
          router.replace("/auth/v1/login");
        }
      }
    }, [user, loading, router, isDemoRequested]);

    if (loading) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    // Allow access if user is authenticated OR demo mode is allowed
    if (user || allowDemo) {
      return <WrappedComponent {...props} />;
    }

    // Show loading while redirecting
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  };

  WithAuthOrDemoComponent.displayName = `withAuthOrDemo(${WrappedComponent.displayName ?? WrappedComponent.name})`;

  return WithAuthOrDemoComponent;
}
