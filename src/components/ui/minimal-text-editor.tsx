"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MinimalTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onSelectionChange?: (selection: { start: number; end: number; text: string }) => void;
  highlightOverlay?: React.ReactNode;
  autoFocus?: boolean;
  minHeight?: string;
}

export function MinimalTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  className,
  style,
  onSelectionChange,
  highlightOverlay,
  autoFocus = false,
  minHeight = "400px"
}: MinimalTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, parseInt(minHeight))}px`;
    }
  }, [minHeight]);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && onSelectionChange) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.slice(start, end);
      
      onSelectionChange({
        start,
        end,
        text: selectedText
      });
    }
  }, [value, onSelectionChange]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Add selection event listeners
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && onSelectionChange) {
      textarea.addEventListener('mouseup', handleSelectionChange);
      textarea.addEventListener('keyup', handleSelectionChange);
      
      return () => {
        textarea.removeEventListener('mouseup', handleSelectionChange);
        textarea.removeEventListener('keyup', handleSelectionChange);
      };
    }
  }, [handleSelectionChange, onSelectionChange]);

  return (
    <div className="relative">
      {/* Highlight Overlay */}
      {highlightOverlay && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {highlightOverlay}
        </div>
      )}
      
      {/* Text Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          // Base styles
          "w-full resize-none border-none bg-transparent",
          "focus:outline-none focus:ring-0",
          "placeholder:text-muted-foreground/60",
          
          // Typography
          "text-base leading-relaxed",
          "font-normal tracking-normal",
          
          // Responsive typography
          "sm:text-lg sm:leading-loose",
          "md:text-xl md:leading-loose",
          
          // Spacing
          "px-0 py-4",
          "sm:py-6",
          "md:py-8",
          
          // Focus state
          isFocused && "placeholder:text-muted-foreground/40",
          
          // Custom classes
          className
        )}
        style={{
          minHeight,
          ...style
        }}
        spellCheck={true}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
      />
      
      {/* Focus Ring */}
      {isFocused && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-primary/20 pointer-events-none" />
      )}
    </div>
  );
}

interface FocusModeEditorProps extends MinimalTextEditorProps {
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export function FocusModeEditor({
  focusMode = false,
  onToggleFocusMode,
  className,
  ...props
}: FocusModeEditorProps) {
  if (focusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="center-column h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-3xl">
              <MinimalTextEditor
                {...props}
                className={cn("text-lg leading-loose", className)}
                minHeight="60vh"
              />
            </div>
          </div>
          
          {onToggleFocusMode && (
            <div className="py-4 text-center">
              <button
                onClick={onToggleFocusMode}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Press Escape or click here to exit focus mode
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <MinimalTextEditor
      {...props}
      className={className}
    />
  );
} 