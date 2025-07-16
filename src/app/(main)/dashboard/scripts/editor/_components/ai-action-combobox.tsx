"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Edit3,
  Sliders,
  Shuffle,
  User,
  Save,
  Search,
  Sparkles,
  X,
  Check,
  Target,
  MessageSquare,
  Heart,
  Briefcase,
  Users,
  Smile,
  Zap,
  BookOpen,
  Crown,
  Coffee,
  ChevronRight,
} from "lucide-react";

import { WTATemplatesModal } from "./wta-templates-modal";
import { type WTATemplate } from "./wta-templates-data";

export interface AIActionOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AIAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  hasSubmenu?: boolean;
  submenuOptions?: AIActionOption[];
}

interface AIActionComboboxProps {
  onActionSelect?: (action: AIAction, customInstruction?: string, submenuOption?: AIActionOption) => void;
  onTemplateSelect?: (template: WTATemplate) => void;
  disabled?: boolean;
  className?: string;
}

const defaultActions: AIAction[] = [
  {
    id: "edit-text",
    icon: Edit3,
    label: "Edit text",
    description: "Refine and improve your content",
    color: "rgb(59, 130, 246)", // Blue
  },
  {
    id: "edit-tone",
    icon: Sliders,
    label: "Edit tone",
    description: "Adjust the voice and style",
    color: "rgb(168, 85, 247)", // Purple
    hasSubmenu: true,
    submenuOptions: [
      {
        id: "professional",
        label: "Professional",
        description: "Formal and business-appropriate",
        icon: Briefcase,
      },
      {
        id: "casual",
        label: "Casual",
        description: "Relaxed and conversational",
        icon: Coffee,
      },
      {
        id: "friendly",
        label: "Friendly",
        description: "Warm and approachable",
        icon: Smile,
      },
      {
        id: "authoritative",
        label: "Authoritative",
        description: "Confident and expert",
        icon: Crown,
      },
      {
        id: "enthusiastic",
        label: "Enthusiastic",
        description: "Energetic and exciting",
        icon: Zap,
      },
      {
        id: "empathetic",
        label: "Empathetic",
        description: "Understanding and caring",
        icon: Heart,
      },
      {
        id: "educational",
        label: "Educational",
        description: "Clear and informative",
        icon: BookOpen,
      },
      {
        id: "collaborative",
        label: "Collaborative",
        description: "Inclusive and team-oriented",
        icon: Users,
      },
    ],
  },
  {
    id: "remix",
    icon: Shuffle,
    label: "Re-mix",
    description: "Generate creative variations",
    color: "rgb(34, 197, 94)", // Green
  },
  {
    id: "humanize",
    icon: User,
    label: "Humanize",
    description: "Make text more natural and conversational",
    color: "rgb(249, 115, 22)", // Orange
  },
  {
    id: "improve-hook",
    icon: Sparkles,
    label: "Improve Hook",
    description: "Make your opening more engaging",
    color: "rgb(236, 72, 153)", // Pink
  },
  {
    id: "strengthen-cta",
    icon: Target,
    label: "Strengthen CTA",
    description: "Enhance your call-to-action",
    color: "rgb(14, 165, 233)", // Sky
  },
  {
    id: "wta-templates",
    icon: MessageSquare,
    label: "WTA Templates",
    description: "Browse ready-made call-to-action templates",
    color: "rgb(16, 185, 129)", // Emerald
  },
  {
    id: "save-template",
    icon: Save,
    label: "Save as template",
    description: "Store for future use",
    color: "rgb(107, 114, 128)", // Gray
  },
];

export default function AIActionCombobox({
  onActionSelect,
  onTemplateSelect,
  disabled = false,
  className = "",
}: AIActionComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isWTAModalOpen, setIsWTAModalOpen] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [hoveredSubmenuIndex, setHoveredSubmenuIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredActions = defaultActions.filter(
    (action) =>
      action.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      action.description.toLowerCase().includes(searchValue.toLowerCase()),
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionSelect = (action: AIAction, submenuOption?: AIActionOption) => {
    setSelectedAction(action);
    setIsOpen(false);
    setExpandedSubmenu(null);

    // Handle WTA Templates separately
    if (action.id === "wta-templates") {
      setIsWTAModalOpen(true);
    } else if (action.hasSubmenu && !submenuOption) {
      // If action has submenu but no option selected, expand the submenu
      setExpandedSubmenu(action.id);
      setIsOpen(true);
      return;
    } else {
      // Call the callback with action and custom instruction if provided
      onActionSelect?.(action, searchValue.trim() || undefined, submenuOption);
    }

    // Clear search after selection
    setSearchValue("");
  };

  const handleCustomInstruction = () => {
    if (searchValue.trim()) {
      const customAction: AIAction = {
        id: "custom",
        icon: Sparkles,
        label: "Custom instruction",
        description: searchValue.trim(),
        color: "rgb(147, 51, 234)", // Purple for custom
      };

      setSelectedAction(customAction);
      setIsOpen(false);
      onActionSelect?.(customAction, searchValue.trim());
      setSearchValue("");
    }
  };

  const handleTemplateSelect = (template: WTATemplate) => {
    setIsWTAModalOpen(false);
    onTemplateSelect?.(template);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (expandedSubmenu) {
        setExpandedSubmenu(null);
        setHoveredSubmenuIndex(-1);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (expandedSubmenu && hoveredSubmenuIndex >= 0) {
        const action = filteredActions.find((a) => a.id === expandedSubmenu);
        if (action?.submenuOptions?.[hoveredSubmenuIndex]) {
          handleActionSelect(action, action.submenuOptions[hoveredSubmenuIndex]);
        }
      } else if (hoveredIndex >= 0 && hoveredIndex < filteredActions.length) {
        handleActionSelect(filteredActions[hoveredIndex]);
      } else if (searchValue.trim()) {
        handleCustomInstruction();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (hoveredIndex >= 0 && hoveredIndex < filteredActions.length) {
        const action = filteredActions[hoveredIndex];
        if (action.hasSubmenu) {
          setExpandedSubmenu(action.id);
          setHoveredSubmenuIndex(0);
        }
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (expandedSubmenu) {
        setExpandedSubmenu(null);
        setHoveredSubmenuIndex(-1);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (expandedSubmenu) {
        const action = filteredActions.find((a) => a.id === expandedSubmenu);
        if (action?.submenuOptions) {
          setHoveredSubmenuIndex((prev) => (prev < action.submenuOptions!.length - 1 ? prev + 1 : prev));
        }
      } else {
        setHoveredIndex((prev) => (prev < filteredActions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (expandedSubmenu) {
        setHoveredSubmenuIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setHoveredIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="bg-background border-border hover:border-muted-foreground flex h-8 items-center justify-between gap-2 rounded-md border px-3 text-xs transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span className="text-foreground font-medium">{selectedAction ? selectedAction.label : "AI Actions"}</span>
        </div>
        <div className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      <div
        className={`bg-background border-border absolute bottom-full left-0 z-50 mb-2 w-80 origin-bottom transform overflow-hidden rounded-lg border shadow-xl transition-all duration-200 ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        {/* AI Input Field */}
        <div className="border-border border-b p-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type custom AI instruction..."
              className="bg-muted focus:ring-primary focus:bg-background w-full rounded-md py-2 pr-3 pl-10 text-sm transition-all duration-200 focus:ring-2 focus:outline-none"
            />
          </div>
          <p className="text-muted-foreground mt-2 px-1 text-xs">💡 Describe what you want AI to do with your text</p>
          {searchValue.trim() && (
            <button
              onClick={handleCustomInstruction}
              className="bg-primary/10 hover:bg-primary/20 text-primary mt-2 w-full rounded-md p-2 text-sm font-medium transition-colors duration-150"
            >
              Run custom instruction: "{searchValue.trim()}"
            </button>
          )}
        </div>

        {/* Actions List */}
        <div className="max-h-80 overflow-y-auto">
          {(searchValue || filteredActions.length > 0) && (
            <div className="text-muted-foreground px-3 py-2 text-xs font-medium tracking-wider uppercase">
              Suggested Actions
            </div>
          )}

          {filteredActions.map((action, index) => (
            <div key={action.id} className="space-y-1">
              {/* Main Action Button */}
              <button
                onClick={() => handleActionSelect(action)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(-1)}
                className={`hover:bg-muted/50 flex w-full items-start gap-3 px-3 py-3 transition-colors duration-150 ${
                  hoveredIndex === index ? "bg-muted/50" : ""
                }`}
              >
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    hoveredIndex === index ? "bg-background shadow-sm" : "bg-muted"
                  } transition-all duration-150`}
                >
                  <action.icon className="h-4 w-4" style={{ color: action.color }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-foreground text-sm font-medium">{action.label}</h4>
                    <div className="flex items-center gap-2">
                      {selectedAction?.id === action.id && <Check className="text-primary h-4 w-4" />}
                      {action.hasSubmenu && <ChevronRight className="text-muted-foreground h-3 w-3" />}
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">{action.description}</p>
                </div>
              </button>

              {/* Submenu Options */}
              {action.hasSubmenu && expandedSubmenu === action.id && action.submenuOptions && (
                <div className="border-border ml-6 space-y-1 border-l pl-3">
                  {action.submenuOptions.map((option, optionIndex) => (
                    <button
                      key={option.id}
                      onClick={() => handleActionSelect(action, option)}
                      onMouseEnter={() => setHoveredSubmenuIndex(optionIndex)}
                      onMouseLeave={() => setHoveredSubmenuIndex(-1)}
                      className={`hover:bg-muted/30 flex w-full items-start gap-2 rounded-md px-2 py-2 transition-colors duration-150 ${
                        hoveredSubmenuIndex === optionIndex ? "bg-muted/30" : ""
                      }`}
                    >
                      <div
                        className={`mt-0.5 rounded-md p-1.5 ${
                          hoveredSubmenuIndex === optionIndex ? "bg-background shadow-sm" : "bg-muted/50"
                        } transition-all duration-150`}
                      >
                        <option.icon className="h-3 w-3" style={{ color: action.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <h5 className="text-foreground text-xs font-medium">{option.label}</h5>
                        <p className="text-muted-foreground text-xs">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredActions.length === 0 && !searchValue.trim() && (
            <div className="px-3 py-8 text-center">
              <p className="text-muted-foreground text-sm">No matching actions found</p>
              <p className="text-muted-foreground/60 mt-1 text-xs">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-border border-t px-3 py-2">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>↵ select • ↑↓ navigate • → submenu • ← back</span>
            <span>ESC to close</span>
          </div>
        </div>
      </div>

      {/* Selected Action Display (Optional) */}
      {selectedAction && (
        <div className="bg-primary/10 border-primary/20 animate-slide-up absolute bottom-full left-0 mb-2 w-full rounded-md border p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-background rounded p-1 shadow-sm">
                <selectedAction.icon className="text-primary h-3 w-3" />
              </div>
              <div>
                <span className="text-foreground text-xs font-medium">{selectedAction.label}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedAction(null)}
              className="hover:bg-primary/20 rounded p-1 transition-colors duration-150"
            >
              <X className="text-muted-foreground h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>

      {/* WTA Templates Modal */}
      <WTATemplatesModal
        open={isWTAModalOpen}
        onOpenChange={setIsWTAModalOpen}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  );
}

export { type AIAction, type AIActionOption };
