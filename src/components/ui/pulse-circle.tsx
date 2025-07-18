"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PulseCircleProps {
  /** Size of the circle in pixels */
  size?: number;
  /** Color of the circle */
  color?: string;
  /** Whether to show multiple rings for smoother effect */
  multipleRings?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Children to render inside the circle */
  children?: React.ReactNode;
  /** Animation duration in seconds */
  duration?: number;
  /** Whether the pulse is active */
  isActive?: boolean;
}

export function PulseCircle({
  size = 40,
  color = "hsl(var(--primary))", // Theme primary color
  multipleRings = true,
  onClick,
  className,
  children,
  duration = 1.8,
  isActive = true,
}: PulseCircleProps) {
  const circleStyle = {
    width: size,
    height: size,
    backgroundColor: color,
    animationDuration: `${duration}s`,
  };

  const baseClasses = cn(
    "relative inline-flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110",
    isActive && (size <= 15 ? "animate-pulse-ring-small" : "animate-pulse-ring"),
    className,
  );

  if (multipleRings) {
    return (
      <div className="relative">
        {/* Ring 1 - Delayed */}
        <div
          className={cn(baseClasses, "absolute", size <= 15 ? "animate-pulse-ring-small" : "animate-pulse-ring")}
          style={{
            ...circleStyle,
            animationDelay: "-1.2s",
          }}
        />
        
        {/* Ring 2 - Mid delay */}
        <div
          className={cn(baseClasses, "absolute", size <= 15 ? "animate-pulse-ring-small" : "animate-pulse-ring")}
          style={{
            ...circleStyle,
            animationDelay: "-0.6s",
          }}
        />
        
        {/* Main circle */}
        <div
          className={cn(baseClasses, "relative z-10")}
          style={circleStyle}
          onClick={onClick}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={baseClasses}
      style={circleStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default PulseCircle;