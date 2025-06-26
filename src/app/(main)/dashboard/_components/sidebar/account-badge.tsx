"use client";

import { Crown, User } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";

export function AccountBadge() {
  const { accountLevel } = useAuth();
  const isPro = accountLevel === "pro";

  return (
    <div className="focus:ring-ring text-foreground flex items-center gap-1 rounded-lg border bg-white px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
      {isPro ? <Crown className="size-3" /> : <User className="size-3" />}
      {isPro ? "Pro" : "Free"} Account
    </div>
  );
}
