"use client";

import { useState, useRef } from "react";

import { Plus, FolderPlus, Video } from "lucide-react";

import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onAddCollection: () => void;
  onAddVideo: () => void;
  className?: string;
  disabled?: boolean;
}

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export function FabAction({ onAddCollection, onAddVideo, className, disabled = false }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsOpen(true);
  };
  const handleClose = () => {
    // Add a small delay to make UX forgiving
    closeTimeout.current = setTimeout(() => setIsOpen(false), 100);
  };

  const dropdownItems: DropdownItem[] = [
    {
      icon: <FolderPlus className="h-4 w-4" />,
      label: "Add Collection",
      onClick: () => {
        console.log("🎯 [FAB] Add Collection dropdown item clicked");
        onAddCollection();
        setIsOpen(false);
      },
    },
    {
      icon: <Video className="h-4 w-4" />,
      label: "Add Video",
      onClick: () => {
        console.log("🎯 [FAB] Add Video dropdown item clicked");
        onAddVideo();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {/* Dropdown Menu */}
      <div
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={cn(
          "absolute right-0 bottom-full mb-2 w-48",
          "rounded-lg border border-gray-200 bg-white shadow-xl",
          "transform transition-all duration-300 ease-out",
          "origin-bottom-right",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0",
        )}
        style={{ zIndex: 100 }}
      >
        <div className="py-1">
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="mx-1 flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-gray-700 transition-colors duration-200 hover:bg-[var(--sidebar-background)] hover:text-gray-900"
            >
              <span className="text-gray-500">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        {/* Arrow pointing down to FAB */}
        <div className="absolute right-6 -bottom-1 h-2 w-2 rotate-45 transform border-r border-b border-gray-200 bg-white"></div>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => console.log("🎯 [FAB] Main button clicked")}
        disabled={disabled}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={cn(
          // Base styles
          "flex items-center gap-2 px-4 py-3",
          "rounded-full shadow-lg",
          // Background and colors
          "bg-[#fcfdf8] text-gray-700",
          // Border styles
          "border border-gray-200/50 md:hover:border-gray-300",
          // Hover effects - button raises slightly
          "hover:bg-gray-50 md:hover:text-gray-900",
          "hover:scale-105 hover:shadow-xl",
          // Transitions
          "transition-all duration-300 ease-out",
          // Active state
          "active:scale-[0.97] active:duration-150 active:ease-out",
          // Focus and outline
          "outline-transparent outline-none focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-[#fcfdf8] disabled:hover:shadow-lg",
          className,
        )}
        aria-label="Add new item"
        role="button"
        tabIndex={0}
      >
        {/* Plus Icon with rotation and scale */}
        <Plus
          className={cn("h-5 w-5 text-gray-600 transition-all duration-300 ease-out", isOpen && "scale-110 rotate-90")}
          strokeWidth={2}
          aria-hidden="true"
        />
        {/* Text with scale effect */}
        <span className={cn("text-sm font-medium transition-all duration-300 ease-out", isOpen && "scale-105")}>
          Add
        </span>
      </button>
    </div>
  );
}
