"use client";

import { useEffect, useRef, useState } from "react";
import { X, Lightbulb, Zap, ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  type ContentElement, 
  type ContextualAction, 
  type DropdownOption,
  type ActionProvider,
  getActionProvider 
} from "@/lib/contextual-actions";

interface ContextualActionMenuProps {
  element: ContentElement;
  position: { x: number; y: number };
  onAction: (action: ContextualAction, element: ContentElement, dropdownOption?: DropdownOption) => void;
  onClose: () => void;
  actionProvider?: ActionProvider;
  contentType?: "script" | "note" | "custom";
  customActions?: Record<string, ContextualAction[]>;
  showConfidence?: boolean;
  showSuggestions?: boolean;
  title?: string;
}

export function ContextualActionMenu({ 
  element, 
  position, 
  onAction, 
  onClose,
  actionProvider,
  contentType = "script",
  customActions,
  showConfidence = true,
  showSuggestions = true,
  title = "AI Actions"
}: ContextualActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);
  
  // Get action provider
  const provider = actionProvider || getActionProvider(contentType, customActions);
  const actions = provider.getActions(element);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y, window.innerHeight - 400),
  };

  const getElementTypeLabel = (type: string) => {
    // Script types
    switch (type) {
      case "hook":
        return "Hook";
      case "bridge":
        return "Bridge";
      case "golden-nugget":
        return "Golden Nugget";
      case "wta":
        return "Call-to-Action";
      // Note types
      case "heading":
        return "Heading";
      case "paragraph":
        return "Paragraph";
      case "list":
        return "List";
      case "quote":
        return "Quote";
      case "code":
        return "Code";
      case "key-point":
        return "Key Point";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getElementTypeColor = (type: string) => {
    // Script types
    switch (type) {
      case "hook":
        return "bg-script-hook text-script-hook-foreground";
      case "bridge":
        return "bg-script-bridge text-script-bridge-foreground";
      case "golden-nugget":
        return "bg-script-golden-nugget text-script-golden-nugget-foreground";
      case "wta":
        return "bg-script-wta text-script-wta-foreground";
      // Note types
      case "heading":
        return "bg-blue-500 text-white";
      case "key-point":
        return "bg-yellow-500 text-white";
      case "quote":
        return "bg-purple-500 text-white";
      case "code":
        return "bg-gray-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]" style={{ pointerEvents: "none" }}>
      <Card
        ref={menuRef}
        className="pointer-events-auto absolute w-80 shadow-lg"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 1000,
          border: "1px solid var(--border)",
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getElementTypeColor(element.type)} text-xs`}>
                {getElementTypeLabel(element.type)}
              </Badge>
              {showConfidence && element.confidence !== undefined && (
                <Badge variant="outline" className={`text-xs ${getConfidenceColor(element.confidence)}`}>
                  {(element.confidence * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-muted-foreground max-w-full text-sm">
            <div className="mb-1 font-medium">Selected Text:</div>
            <div className="bg-muted max-h-20 overflow-y-auto rounded p-2 text-xs break-words">
              &ldquo;{element.text}&rdquo;
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Suggestions */}
          {showSuggestions && element.suggestions && element.suggestions.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Suggestions</span>
              </div>
              <div className="space-y-1">
                {element.suggestions.map((suggestion, index) => (
                  <div key={index} className="text-muted-foreground bg-muted/50 rounded p-2 text-xs">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(showSuggestions && element.suggestions && element.suggestions.length > 0) && <Separator className="my-4" />}

          {/* Actions */}
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-1">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{title}</span>
            </div>

            {actions.map((action) => (
              <div key={action.id} className="space-y-1">
                {/* Main Action Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (action.hasDropdown) {
                      setExpandedDropdown(expandedDropdown === action.id ? null : action.id);
                    } else {
                      onAction(action, element);
                    }
                  }}
                  className="h-auto w-full justify-start p-2 text-left"
                >
                  <div className="flex items-start gap-2 w-full">
                    <span className="text-sm">{action.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{action.label}</div>
                      <div className="text-muted-foreground text-xs">{action.description}</div>
                    </div>
                    {action.hasDropdown && (
                      <div className="ml-auto">
                        {expandedDropdown === action.id ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </Button>

                {/* Dropdown Options */}
                {action.hasDropdown && expandedDropdown === action.id && action.dropdownOptions && (
                  <div className="ml-6 space-y-1 border-l border-border pl-3">
                    {action.dropdownOptions.map((option) => (
                      <Button
                        key={option.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onAction(action, element, option);
                          setExpandedDropdown(null);
                        }}
                        className="h-auto w-full justify-start p-2 text-left"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs">{option.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium">{option.label}</div>
                            <div className="text-muted-foreground text-xs">{option.description}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}