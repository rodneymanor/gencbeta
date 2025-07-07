"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface ShineBorderProps {
  children?: React.ReactNode;
  className?: string;
  shineColor?: string[];
  duration?: number;
  borderWidth?: number;
}

export function ShineBorder({
  children,
  className,
  shineColor = ["#A07CFE", "#FE8FB5", "#FFBE7B"],
  duration = 3,
  borderWidth = 1,
}: ShineBorderProps) {
  const borderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const border = borderRef.current;
    if (!border) return;

    const animate = () => {
      border.style.setProperty("--shine-deg", "0deg");
      border.style.setProperty("--shine-opacity", "0");

      setTimeout(() => {
        border.style.setProperty("--shine-opacity", "1");
        border.style.setProperty("--shine-deg", "360deg");
      }, 100);
    };

    animate();
    const interval = setInterval(animate, duration * 1000);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      ref={borderRef}
      className={cn("relative", className)}
      style={
        {
          "--shine-deg": "0deg",
          "--shine-opacity": "0",
          "--border-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: `conic-gradient(from var(--shine-deg), transparent 0deg, ${shineColor[0]} 60deg, ${shineColor[1]} 120deg, ${shineColor[2]} 180deg, transparent 240deg)`,
          opacity: "var(--shine-opacity)",
          transition: `opacity ${duration * 0.1}s ease-in-out, --shine-deg ${duration}s linear`,
        }}
      />
      {children}
    </div>
  );
}
