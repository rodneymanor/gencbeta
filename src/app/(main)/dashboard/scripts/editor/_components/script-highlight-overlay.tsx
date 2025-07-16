"use client";

import { useEffect, useRef, useState } from "react";

import { type ScriptAnalysis, type ScriptElement } from "@/lib/script-analysis";

interface ScriptHighlightOverlayProps {
  analysis: ScriptAnalysis;
  onElementClick: (element: ScriptElement, event: React.MouseEvent) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

interface HighlightBox {
  element: ScriptElement;
  rect: DOMRect;
}

export function ScriptHighlightOverlay({ analysis, onElementClick, editorRef }: ScriptHighlightOverlayProps) {
  const [highlightBoxes, setHighlightBoxes] = useState<HighlightBox[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Update highlights when analysis changes
  useEffect(() => {
    if (!editorRef.current) return;

    const updateHighlights = () => {
      const allElements = [...analysis.hooks, ...analysis.bridges, ...analysis.goldenNuggets, ...analysis.wtas];

      const boxes: HighlightBox[] = [];
      const editorElement = editorRef.current;
      if (!editorElement) return;

      // Find text nodes and create highlight boxes
      allElements.forEach((element) => {
        try {
          // Simple approach: find text content and create approximate highlights
          const textContent = editorElement.textContent || "";
          const elementIndex = textContent.indexOf(element.text);

          if (elementIndex !== -1) {
            // Create a temporary span to measure text position
            const range = document.createRange();
            const walker = document.createTreeWalker(editorElement, NodeFilter.SHOW_TEXT, null);

            let currentIndex = 0;
            let textNode = walker.nextNode();

            while (textNode && currentIndex < elementIndex + element.text.length) {
              const nodeText = textNode.textContent || "";
              const nodeEndIndex = currentIndex + nodeText.length;

              if (elementIndex >= currentIndex && elementIndex < nodeEndIndex) {
                // Found the start node
                const startOffset = elementIndex - currentIndex;
                const endOffset = Math.min(startOffset + element.text.length, nodeText.length);

                range.setStart(textNode, startOffset);
                range.setEnd(textNode, endOffset);

                const rect = range.getBoundingClientRect();
                const editorRect = editorElement.getBoundingClientRect();

                // Convert to relative coordinates
                const relativeRect = new DOMRect(
                  rect.left - editorRect.left,
                  rect.top - editorRect.top,
                  rect.width,
                  rect.height,
                );

                boxes.push({ element, rect: relativeRect });
                break;
              }

              currentIndex = nodeEndIndex;
              textNode = walker.nextNode();
            }
          }
        } catch (error) {
          console.warn("Failed to create highlight for element:", element, error);
        }
      });

      setHighlightBoxes(boxes);
    };

    // Initial update
    updateHighlights();

    // Update on resize
    const handleResize = () => updateHighlights();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [analysis, editorRef]);

  const getElementColor = (type: ScriptElement["type"]) => {
    // Subtle hover effects with shadows instead of colors
    return "hover:shadow-md hover:bg-background/50 transition-all duration-200";
  };

  return (
    <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-10" style={{ pointerEvents: "none" }}>
      {highlightBoxes.map((box, index) => (
        <div
          key={`${box.element.type}-${index}`}
          className={`pointer-events-auto absolute cursor-pointer rounded-sm ${getElementColor(box.element.type)}`}
          style={{
            left: box.rect.left,
            top: box.rect.top,
            width: box.rect.width,
            height: box.rect.height,
            pointerEvents: "auto",
          }}
          onClick={(event) => onElementClick(box.element, event)}
          title={`Click to edit ${box.element.type}`}
        />
      ))}
    </div>
  );
}
