"use client";

import { CircleUser, Crown, User } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface ProfileWithBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
}

export function ProfileWithBadge({ 
  size = "md", 
  className = "",
  showBadge = true 
}: ProfileWithBadgeProps) {
  const { accountLevel, initializing, user } = useAuth();

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "h-8 w-8",
      icon: "h-4 w-4",
      badge: "h-4 w-4 text-[8px]",
      badgeOffset: "-bottom-1 -right-1"
    },
    md: {
      container: "h-10 w-10",
      icon: "h-5 w-5",
      badge: "h-5 w-5 text-[9px]",
      badgeOffset: "-bottom-1 -right-1"
    },
    lg: {
      container: "h-12 w-12",
      icon: "h-6 w-6",
      badge: "h-6 w-6 text-xs",
      badgeOffset: "-bottom-2 -right-2"
    }
  };

  const config = sizeConfig[size];
  const isPro = accountLevel === "pro";

  return (
    <div className={cn("relative", className)}>
      {/* Profile Icon */}
      <div className={cn(
        "bg-primary/10 flex items-center justify-center rounded-lg",
        config.container
      )}>
        <CircleUser className={cn("text-primary", config.icon)} />
      </div>

      {/* Account Level Badge */}
      {showBadge && user && !initializing && (
        <div className={cn(
          "absolute flex items-center justify-center rounded-full border-2 border-white shadow-sm",
          config.badge,
          config.badgeOffset,
          isPro 
            ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white" 
            : "bg-gray-100 text-gray-600"
        )}>
          {isPro ? (
            <Crown className="h-2 w-2" />
          ) : (
            <User className="h-2 w-2" />
          )}
        </div>
      )}

      {/* Loading State Badge */}
      {showBadge && initializing && (
        <div className={cn(
          "absolute flex items-center justify-center rounded-full border-2 border-white bg-gray-100 shadow-sm",
          config.badge,
          config.badgeOffset
        )}>
          <div className="h-1 w-1 animate-pulse rounded-full bg-gray-400" />
        </div>
      )}
    </div>
  );
} 