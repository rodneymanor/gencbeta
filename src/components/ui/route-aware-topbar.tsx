"use client";

import { useRouteTopBar } from '@/hooks/use-route-topbar';
import { TopBar } from './top-bar';

export function RouteAwareTopBar() {
  // This hook automatically configures the top bar based on the current route
  useRouteTopBar();
  
  return <TopBar />;
} 