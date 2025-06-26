"use client";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

export function AccountBadge() {
  const { accountLevel } = useAuth();

  return (
    <Badge variant={accountLevel === "pro" ? "default" : "secondary"} className="px-3 py-1 text-sm font-medium">
      {accountLevel === "pro" ? "Pro" : "Free"} Account
    </Badge>
  );
}
