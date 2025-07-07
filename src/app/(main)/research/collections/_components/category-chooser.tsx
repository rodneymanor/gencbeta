"use client";

import { useState } from "react";

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
}

interface CategoryChooserProps {
  items: CategoryItem[];
  selectedId?: string;
  onSelectionChange?: (item: CategoryItem) => void;
  className?: string;
  label?: string; // For accessibility
}

export default function CategoryChooser({
  items,
  selectedId,
  onSelectionChange,
  className = "",
  label = "Categories",
}: CategoryChooserProps) {
  const [activeId, setActiveId] = useState(selectedId ?? items[0]?.id);

  const handleItemClick = (item: CategoryItem) => {
    setActiveId(item.id);
    onSelectionChange?.(item);
  };

  return (
    <div
      className={`isolate flex-col items-end p-4 ${className}`}
      style={{ opacity: 1, transform: "none", transformOrigin: "50% 50% 0px" }}
      role="navigation"
      aria-label={label}
    >
      <ul className="-mb-1 flex w-full flex-col items-start">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <li
              key={item.id}
              className="group relative flex w-full flex-col transition-all duration-500 ease-out select-none"
              style={{
                animationDuration: "1800ms",
                height: isActive ? "44px" : "24px",
              }}
            >
              <div
                className="flex h-full w-full items-center justify-start transition-all duration-500 ease-out"
                style={{
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "left center",
                }}
              >
                <div
                  className={`line-clamp-2 cursor-pointer gap-1 pl-6 font-sans text-sm transition-all duration-500 ease-out group-hover:opacity-100 selection:bg-blue-500/50 selection:text-gray-900 dark:selection:bg-blue-500/10 dark:selection:text-blue-500 ${
                    isActive
                      ? "text-base font-semibold text-gray-900 opacity-100 dark:text-gray-100"
                      : "text-sm font-normal text-gray-600 opacity-75 dark:text-gray-400"
                  }`}
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  aria-pressed={isActive}
                  style={{
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {item.name}
                </div>
              </div>

              {/* Connector line */}

              {/* Active/Inactive indicator with smooth transitions */}
              <div
                className={`absolute top-0 bottom-0 left-0 z-[1] rounded-full transition-all duration-500 ease-out ${
                  isActive
                    ? "w-[3px] bg-gray-900 opacity-100 shadow-sm dark:bg-gray-100"
                    : "w-[2px] bg-gray-900 opacity-20 dark:bg-gray-100"
                }`}
                style={{
                  transform: isActive ? "scaleY(1)" : "scaleY(0.8)",
                  transformOrigin: "center",
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
