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
import { TextHighlightOverlay } from "./text-highlight-overlay";

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface HemingwayEditorCoreProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
  highlightConfig: HighlightConfig;
  elements?: ScriptElements; // New prop for structured elements
  onAnalysisChange?: (analysis: ScriptAnalysis) => void;
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
  elements,
  onAnalysisChange,
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

  // Create analysis from structured elements
  const createAnalysisFromElements = useCallback(
    (text: string, structuredElements: ScriptElements): ScriptAnalysis => {
      const analysisResult: ScriptAnalysis = {
        hooks: [],
        bridges: [],
        goldenNuggets: [],
        wtas: [],
      };

      let currentIndex = 0;

      // Process each element type in order
      const elementTypes = ['hook', 'bridge', 'goldenNugget', 'wta'] as const;
      
      elementTypes.forEach((elementType) => {
        const elementText = structuredElements[elementType];
        if (!elementText.trim()) return;

        const startIndex = text.indexOf(elementText, currentIndex);
        if (startIndex === -1) return;

        const endIndex = startIndex + elementText.length;
        const element: ScriptElement = {
          type: elementType === 'goldenNugget' ? 'golden-nugget' : 
                elementType === 'wta' ? 'wta' : 
                elementType as 'hook' | 'bridge',
          startIndex,
          endIndex,
          text: elementText,
          confidence: 1.0, // High confidence for structured elements
          suggestions: [],
        };

        // Add to appropriate array
        if (elementType === 'hook') analysisResult.hooks.push(element);
        else if (elementType === 'bridge') analysisResult.bridges.push(element);
        else if (elementType === 'goldenNugget') analysisResult.goldenNuggets.push(element);
        else if (elementType === 'wta') analysisResult.wtas.push(element);

        currentIndex = endIndex;
      });

      return analysisResult;
    },
    [],
  );

  // Debounced analysis
  const analyzeText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        const emptyAnalysis = { hooks: [], bridges: [], goldenNuggets: [], wtas: [] };
        setAnalysis(emptyAnalysis);
        onAnalysisChange?.(emptyAnalysis);
        return;
      }

      try {
        let result: ScriptAnalysis;
        
        // Use structured elements if available, otherwise fall back to pattern-based analysis
        if (elements && (elements.hook || elements.bridge || elements.goldenNugget || elements.wta)) {
          result = createAnalysisFromElements(text, elements);
        } else {
          result = await analyzeScriptElements(text, highlightConfig);
        }
        
        setAnalysis(result);
        onAnalysisChange?.(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    },
    [highlightConfig, elements, createAnalysisFromElements, onAnalysisChange],
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

  // Handle element click from overlay
  const handleElementClick = useCallback((element: ScriptElement, event?: React.MouseEvent) => {
    if (event) {
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
      setSelectedElement(element);
    }
  }, []);

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
          className={`h-full w-full resize-none border-0 bg-transparent px-8 py-8 text-base leading-relaxed focus:ring-0 focus:outline-none ${
            readOnly ? "cursor-default" : ""
          }`}
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "16px",
            lineHeight: "1.7",
          }}
        />

        {/* Text Highlight Overlay */}
        <TextHighlightOverlay
          text={value}
          analysis={analysis}
          textareaRef={textareaRef}
          highlightConfig={highlightConfig}
          onElementClick={handleElementClick}
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
