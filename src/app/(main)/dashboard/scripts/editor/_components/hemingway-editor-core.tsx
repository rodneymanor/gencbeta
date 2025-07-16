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
} from "@/lib/script-analysis";

import { AIInputPanel } from "./ai-input-panel";
import { ScriptBlocksOverlay } from "./script-blocks-overlay";
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

  const [selectedElement, setSelectedElement] = useState<ScriptElement | any | null>(null);
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

  // Create script blocks from structured elements - ALWAYS create exactly 4 blocks
  const createScriptBlocks = useCallback((scriptElements: ScriptElements): PartialBlock[] => {
    const blocks: PartialBlock[] = [];

    // Always create exactly 4 blocks, even if some are empty
    blocks.push({
      type: "paragraph",
      content: scriptElements.hook?.trim() || "[Hook - Add your opening here]",
    });

    blocks.push({
      type: "paragraph",
      content: scriptElements.bridge?.trim() || "[Bridge - Add your transition here]",
    });

    blocks.push({
      type: "paragraph",
      content: scriptElements.goldenNugget?.trim() || "[Golden Nugget - Add your main point here]",
    });

    blocks.push({
      type: "paragraph",
      content: scriptElements.wta?.trim() || "[WTA - Add your call-to-action here]",
    });

    return blocks;
  }, []);

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: elements
      ? createScriptBlocks(elements) // Always use structured blocks if elements are provided
      : value
        ? [{ type: "paragraph", content: value }]
        : undefined,
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
        .join("\n\n"); // Use double newlines to separate blocks

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

  // Handle element click from overlay (supports both ScriptElement and ScriptBlock)
  const handleElementClick = useCallback((element: any, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setSelectedElement(element);
  }, []);

  // Handle AI menu action
  const handleAIAction = useCallback(
    (actionType: string, customPrompt?: string, option?: string) => {
      setContextMenuPosition(null);
      setSelectedElement(null);

      console.log("AI Action:", actionType, "Custom prompt:", customPrompt, "Option:", option);

      // TODO: Implement AI service calls for each action type
      switch (actionType) {
        case "custom_prompt":
          console.log("Custom prompt:", customPrompt, "for element:", selectedElement?.text);
          break;
        case "humanize":
          console.log("Humanizing text:", selectedElement?.text);
          break;
        case "shorten":
          console.log("Shortening text:", selectedElement?.text);
          break;
        case "change_tone":
          console.log("Changing tone to:", option, "for text:", selectedElement?.text);
          break;
        case "change_style":
          console.log("Changing style to:", option, "for text:", selectedElement?.text);
          break;
        case "enhance_value":
          console.log("Enhancing value for:", selectedElement?.text);
          break;
        case "add_evidence":
          console.log("Adding evidence for:", selectedElement?.text);
          break;
        case "clarify_benefit":
          console.log("Clarifying benefit for:", selectedElement?.text);
          break;
        default:
          console.log("Unknown action:", actionType);
      }
    },
    [selectedElement],
  );

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setSelectedElement(null);
  }, []);

  // Handle text update from AI actions (like humanize)
  const handleTextUpdate = useCallback(
    (newText: string) => {
      if (!selectedElement) return;

      // Find the block containing the selected text and update it
      const blocks = [...editor.document];
      let blockFound = false;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.type === "paragraph" && block.content) {
          const blockText = Array.isArray(block.content)
            ? block.content.map((item) => (typeof item === "string" ? item : (item as any)?.text || "")).join("")
            : String(block.content);

          if (blockText.includes(selectedElement.text)) {
            // Update the block with the new text
            const updatedBlockText = blockText.replace(selectedElement.text, newText);
            blocks[i] = { ...block, content: updatedBlockText };
            blockFound = true;
            break;
          }
        }
      }

      if (blockFound) {
        // Replace all blocks in the editor
        editor.replaceBlocks(editor.document, blocks);
      }

      // Close the context menu
      closeContextMenu();
    },
    [selectedElement, editor, closeContextMenu],
  );

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

        {/* Script Blocks Overlay */}
        <ScriptBlocksOverlay blocks={editor.document} onBlockClick={handleElementClick} editorRef={editorRef} />
      </div>

      {/* AI Input Panel */}
      {contextMenuPosition && selectedElement && (
        <AIInputPanel
          element={selectedElement}
          position={contextMenuPosition}
          onAction={handleAIAction}
          onTextUpdate={handleTextUpdate}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
