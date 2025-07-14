"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import AuthLoading from "@/components/ui/auth-loading";
import { useAuth } from "@/contexts/auth-context";

export default function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading, initializing } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Only redirect if we're done initializing and there's no user
      if (!initializing && !user && !loading) {
        router.replace("/auth/v1/login");
      }
    }, [user, loading, initializing, router]);

    // Show auth loading during initial Firebase auth check
    if (initializing) {
      return <AuthLoading />;
    }

    // Show auth loading if we're redirecting to login
    if (!user && !loading) {
      return <AuthLoading />;
    }

    // Show auth loading during other operations
    if (loading) {
      return <AuthLoading />;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name})`;

  return WithAuthComponent;
}
