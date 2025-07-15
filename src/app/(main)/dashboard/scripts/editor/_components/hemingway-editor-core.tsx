"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { BlockNoteEditor, PartialBlock, BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

import {
  analyzeScriptElements,
  type ScriptAnalysis,
  type ScriptElement,
  type HighlightConfig,
  type ContextualAction,
} from "@/lib/script-analysis";

import { ContextualActionMenu } from "./contextual-action-menu";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

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
  onBlocksChange?: (blocks: PartialBlock[]) => void; // New prop for JSON blocks
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
  onBlocksChange,
}: HemingwayEditorCoreProps) {
  const [analysis, setAnalysis] = useState<ScriptAnalysis>({
    hooks: [],
    bridges: [],
    goldenNuggets: [],
    wtas: [],
  });

  const [selectedElement, setSelectedElement] = useState<ScriptElement | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate script title from first few words
  const generateScriptTitle = useCallback((text: string): string => {
    if (!text.trim()) return "Untitled Script";

    const words = text.trim().split(/\s+/);
    const titleWords = words.slice(0, 6); // Take first 6 words
    let title = titleWords.join(" ");

    // If the title is too long, truncate it
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    } else if (words.length > 6) {
      title += "...";
    }

    return title;
  }, []);

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: value ? [{ type: "paragraph", content: value }] : undefined,
  });

  // Handle editor content changes
  const handleEditorChange = useCallback(
    (editor: BlockNoteEditor) => {
      // Convert blocks to plain text for analysis
      const plainText = editor.document
        .map((block) => {
          if (block.type === "paragraph") {
            return (
              block.content
                ?.map((item) => {
                  if (typeof item === "string") return item;
                  // Handle styled text content
                  if (item && typeof item === "object" && "text" in item) {
                    return item.text || "";
                  }
                  return "";
                })
                .join("") || ""
            );
          }
          return "";
        })
        .join("\n");

      onChange(plainText);

      // Also provide blocks as JSON for external use
      if (onBlocksChange) {
        onBlocksChange(editor.document);
      }
    },
    [onChange, onBlocksChange],
  );

  // Create analysis from structured elements
  const createAnalysisFromElements = useCallback((text: string, structuredElements: ScriptElements): ScriptAnalysis => {
    const analysisResult: ScriptAnalysis = {
      hooks: [],
      bridges: [],
      goldenNuggets: [],
      wtas: [],
    };

    let currentIndex = 0;

    // Process each element type in order
    const elementTypes = ["hook", "bridge", "goldenNugget", "wta"] as const;

    elementTypes.forEach((elementType) => {
      const elementText = structuredElements[elementType];
      if (!elementText.trim()) return;

      const startIndex = text.indexOf(elementText, currentIndex);
      if (startIndex === -1) return;

      const endIndex = startIndex + elementText.length;
      const element: ScriptElement = {
        type: elementType === "goldenNugget" ? "golden-nugget" : elementType === "wta" ? "wta" : elementType,
        startIndex,
        endIndex,
        text: elementText,
        confidence: 1.0, // High confidence for structured elements
        suggestions: [],
      };

      // Add to appropriate array
      if (elementType === "hook") analysisResult.hooks.push(element);
      else if (elementType === "bridge") analysisResult.bridges.push(element);
      else if (elementType === "goldenNugget") analysisResult.goldenNuggets.push(element);
      else if (elementType === "wta") analysisResult.wtas.push(element);

      currentIndex = endIndex;
    });

    return analysisResult;
  }, []);

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

  // Handle element click from overlay (disabled for now until highlighting is implemented)
  // const handleElementClick = useCallback((element: ScriptElement, event?: React.MouseEvent) => {
  //   if (event) {
  //     setContextMenuPosition({ x: event.clientX, y: event.clientY });
  //     setSelectedElement(element);
  //   }
  // }, []);

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

  const scriptTitle = generateScriptTitle(value);

  return (
    <div className="relative flex-1">
      {/* Script Title Header */}
      <div className="border-border/20 bg-background/50 border-b px-6 py-4">
        <h1 className="text-foreground text-2xl font-semibold">{scriptTitle}</h1>
      </div>

      {/* Editor Container */}
      <div ref={editorRef} className="relative h-full">
        <BlockNoteView
          editor={editor}
          theme="light"
          className="h-full w-full"
          onChange={handleEditorChange}
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "16px",
            lineHeight: "1.7",
          }}
        />

        {/* TODO: Implement BlockNote-compatible highlighting overlay */}
        {/* The TextHighlightOverlay needs to be adapted for BlockNote */}
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
