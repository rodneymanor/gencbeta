"use client";

import { useEffect, useRef } from "react";

import { Card } from "@/components/ui/card";

interface SubmenuOption {
  key: string;
  label: string;
  description: string;
}

interface FloatingSubmenuProps {
  options: SubmenuOption[];
  position: { x: number; y: number };
  onOptionSelect: (optionKey: string) => void;
  onClose: () => void;
  actionLabel: string;
  actionIcon: string;
}

export function FloatingSubmenu({
  options,
  position,
  onOptionSelect,
  onClose,
  actionLabel,
  actionIcon,
}: FloatingSubmenuProps) {
  const submenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 280),
    y: Math.min(position.y, window.innerHeight - (options.length * 50 + 100)),
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]">
      <Card
        ref={submenuRef}
        className="border-border pointer-events-auto absolute w-64 border shadow-lg"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 1000,
        }}
      >
        <div className="p-2">
          {/* Header */}
          <div className="text-muted-foreground border-border mb-2 border-b px-2 py-2 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span>{actionIcon}</span>
              <span>{actionLabel}</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => onOptionSelect(option.key)}
                className="hover:bg-accent/20 hover:text-accent-foreground flex w-full items-center rounded-md px-3 py-2 text-left transition-colors duration-150"
              >
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
