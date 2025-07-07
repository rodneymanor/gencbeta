"use client";

import { useEffect } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { useTopBar } from "@/contexts/topbar-context";
import { getRouteConfig, resolveTitle } from "@/lib/topbar-config";

export function useRouteTopBar() {
  const { setConfig } = useTopBar();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get route configuration
    const routeConfig = getRouteConfig(pathname);

    // Resolve dynamic title if needed
    const dynamicTitle = resolveTitle(pathname, searchParams);

    // Apply configuration
    setConfig({
      ...routeConfig,
      title: dynamicTitle ?? routeConfig.title,
    });

    // Cleanup function to reset on unmount
    return () => {
      setConfig({
        title: routeConfig.title,
      });
    };
  }, [pathname, searchParams, setConfig]);
}

// Alternative hook for manual configuration
export function useTopBarConfig() {
  const { setConfig } = useTopBar();
  return setConfig;
}
