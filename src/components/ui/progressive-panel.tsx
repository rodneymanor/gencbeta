"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProgressivePanelProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  position?: "bottom" | "right";
  collapsible?: boolean;
  className?: string;
}

export function ProgressivePanel({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  size = "md",
  position = "bottom",
  collapsible = true,
  className
}: ProgressivePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onToggle();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onToggle]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-2xl sm:max-w-xl", 
    lg: "max-w-4xl sm:max-w-2xl",
    xl: "max-w-6xl sm:max-w-3xl"
  };

  const positionClasses = {
    bottom: "bottom-0 left-0 right-0 rounded-t-lg",
    right: "top-0 right-0 bottom-0 rounded-l-lg w-96 sm:w-80 md:w-96"
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onToggle}
      />
      
      {/* Panel */}
      <div className={cn(
        "fixed z-50 bg-background border shadow-lg",
        positionClasses[position],
        position === "bottom" && "center-column",
        position === "bottom" && sizeClasses[size],
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <h3 className="font-medium">{title}</h3>
          </div>
          
          <div className="flex items-center gap-1">
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        {!isCollapsed && (
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </>
  );
}

interface ProgressivePanelTriggerProps {
  children: React.ReactNode;
  panel: React.ReactNode;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  size?: "sm" | "md" | "lg" | "xl";
  position?: "bottom" | "right";
}

export function ProgressivePanelTrigger({
  children,
  panel,
  title,
  icon,
  size = "md",
  position = "bottom"
}: ProgressivePanelTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      
      <ProgressivePanel
        title={title}
        icon={icon}
        isOpen={isOpen}
        onToggle={() => setIsOpen(false)}
        size={size}
        position={position}
      >
        {panel}
      </ProgressivePanel>
    </>
  );
} 