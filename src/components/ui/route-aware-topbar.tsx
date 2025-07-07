"use client";

import { useRouteTopBar } from '@/hooks/use-route-topbar';
import { TopBar } from './top-bar';
import { useTopBar } from '@/hooks/use-topbar';

export function RouteAwareTopBar() {
  // This hook automatically configures the top bar based on the current route
  useRouteTopBar();

  const { config } = useTopBar();

  return (
    <TopBar
      title={config.title}
      description={config.description}
      actions={config.actions}
      isLoading={config.isLoading}
    />
  );
} 