"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import AuthLoading from "@/components/ui/auth-loading";
import { useAuth } from "@/contexts/auth-context";

export default function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading, initializing, hasValidCache, isBackgroundVerifying } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Only redirect if we're done initializing and there's no user
      if (!initializing && !user && !loading && !hasValidCache) {
        router.replace("/auth/v1/login");
      }
    }, [user, loading, initializing, hasValidCache, router]);

    // Show auth loading only if we're initializing AND don't have valid cache
    if (initializing && !hasValidCache) {
      return <AuthLoading />;
    }

    // Show auth loading if we're redirecting to login (no cache and no user)
    if (!user && !loading && !hasValidCache) {
      return <AuthLoading />;
    }

    // Show auth loading during explicit operations (but not background verification)
    if (loading && !isBackgroundVerifying) {
      return <AuthLoading />;
    }

    // If we have valid cache, show content immediately even during background verification
    if (hasValidCache || user) {
      return <WrappedComponent {...props} />;
    }

    // Fallback to loading state
    return <AuthLoading />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name})`;

  return WithAuthComponent;
}
