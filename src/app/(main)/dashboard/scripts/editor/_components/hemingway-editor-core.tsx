"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import TextareaAutosize from "react-textarea-autosize";

import {
  analyzeScriptElements,
  type ScriptAnalysis,
  type ScriptElement,
  type HighlightConfig,
  type ContextualAction,
} from "@/lib/script-analysis";

import { ContextualActionMenu } from "./contextual-action-menu";

interface HemingwayEditorCoreProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
  highlightConfig: HighlightConfig;
}

export function HemingwayEditorCore({
  value,
  onChange,
  placeholder = "Start writing your script...",
  minRows = 10,
  maxRows = 50,
  readOnly = false,
  autoFocus = false,
  highlightConfig,
}: HemingwayEditorCoreProps) {
  const [analysis, setAnalysis] = useState<ScriptAnalysis>({
    hooks: [],
    bridges: [],
    goldenNuggets: [],
    wtas: [],
  });

  const [selectedElement, setSelectedElement] = useState<ScriptElement | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced analysis
  const analyzeText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setAnalysis({ hooks: [], bridges: [], goldenNuggets: [], wtas: [] });
        return;
      }

      try {
        const result = await analyzeScriptElements(text, highlightConfig);
        setAnalysis(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    },
    [highlightConfig],
  );

  // Trigger analysis on text change
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyzeText(value);
    }, 500);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [value, analyzeText]);

  // Handle context menu action
  const handleContextAction = useCallback((action: ContextualAction, element: ScriptElement) => {
    setContextMenuPosition(null);
    setSelectedElement(null);

    // Here you would implement the actual action logic
    console.log("Context action:", action, "on element:", element);
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setSelectedElement(null);
  }, []);

  return (
    <div className="relative flex-1">
      <div ref={editorRef} className="relative h-full">
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minRows={minRows}
          maxRows={maxRows}
          readOnly={readOnly}
          autoFocus={autoFocus}
          className={`h-full w-full resize-none border-0 bg-transparent p-6 font-mono text-sm focus:ring-0 focus:outline-none ${
            readOnly ? "cursor-default" : ""
          }`}
          style={{
            fontSize: "inherit",
            lineHeight: "inherit",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Context Menu */}
      {contextMenuPosition && selectedElement && (
        <ContextualActionMenu
          element={selectedElement}
          position={contextMenuPosition}
          onAction={handleContextAction}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
