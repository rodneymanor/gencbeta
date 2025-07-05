"use client";

import { useEffect, useRef, useState } from "react";
import { type ScriptAnalysis, type ScriptElement } from "@/lib/script-analysis";

interface TextHighlightOverlayProps {
  text: string;
  analysis: ScriptAnalysis;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  highlightConfig: {
    hooks: boolean;
    bridges: boolean;
    goldenNuggets: boolean;
    wtas: boolean;
  };
  onElementClick?: (element: ScriptElement) => void;
}

interface HighlightBox {
  id: string;
  type: ScriptElement["type"];
  left: number;
  top: number;
  width: number;
  height: number;
  element: ScriptElement;
}

export function TextHighlightOverlay({
  text,
  analysis,
  textareaRef,
  highlightConfig,
  onElementClick,
}: TextHighlightOverlayProps) {
  const [highlightBoxes, setHighlightBoxes] = useState<HighlightBox[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get all elements that should be highlighted
  const getVisibleElements = (): ScriptElement[] => {
    const elements: ScriptElement[] = [];
    
    if (highlightConfig.hooks) elements.push(...analysis.hooks);
    if (highlightConfig.bridges) elements.push(...analysis.bridges);
    if (highlightConfig.goldenNuggets) elements.push(...analysis.goldenNuggets);
    if (highlightConfig.wtas) elements.push(...analysis.wtas);
    
    return elements.sort((a, b) => a.startIndex - b.startIndex);
  };

  // Calculate highlight positions
  const calculateHighlightPositions = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas font to match textarea
    const computedStyle = window.getComputedStyle(textarea);
    ctx.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;

    const textareaRect = textarea.getBoundingClientRect();
    const textareaStyle = window.getComputedStyle(textarea);
    const paddingLeft = parseInt(textareaStyle.paddingLeft);
    const paddingTop = parseInt(textareaStyle.paddingTop);
    const lineHeight = parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize) * 1.2;

    const boxes: HighlightBox[] = [];
    const elements = getVisibleElements();

    elements.forEach((element, index) => {
      const beforeText = text.substring(0, element.startIndex);
      const elementText = text.substring(element.startIndex, element.endIndex);

      // Calculate position based on text metrics
      const lines = beforeText.split('\n');
      const lineIndex = lines.length - 1;
      const lastLineText = lines[lineIndex] || '';
      
      const textWidth = ctx.measureText(lastLineText).width;
      const elementWidth = ctx.measureText(elementText).width;

      boxes.push({
        id: `${element.type}-${index}`,
        type: element.type,
        left: paddingLeft + textWidth,
        top: paddingTop + (lineIndex * lineHeight),
        width: elementWidth,
        height: lineHeight,
        element,
      });
    });

    setHighlightBoxes(boxes);
  };

  // Update highlights when text or analysis changes
  useEffect(() => {
    const timer = setTimeout(calculateHighlightPositions, 100);
    return () => clearTimeout(timer);
  }, [text, analysis, highlightConfig]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => calculateHighlightPositions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get color for element type
  const getElementColor = (type: ScriptElement["type"]): string => {
    switch (type) {
      case "hook":
        return "rgba(251, 146, 60, 0.15)"; // Orange
      case "bridge":
        return "rgba(6, 182, 212, 0.15)"; // Cyan
      case "golden-nugget":
        return "rgba(59, 130, 246, 0.15)"; // Blue
      case "wta":
        return "rgba(251, 146, 60, 0.15)"; // Orange
      default:
        return "rgba(156, 163, 175, 0.15)"; // Gray
    }
  };

  const getBorderColor = (type: ScriptElement["type"]): string => {
    switch (type) {
      case "hook":
        return "rgba(251, 146, 60, 0.4)";
      case "bridge":
        return "rgba(6, 182, 212, 0.4)";
      case "golden-nugget":
        return "rgba(59, 130, 246, 0.4)";
      case "wta":
        return "rgba(251, 146, 60, 0.4)";
      default:
        return "rgba(156, 163, 175, 0.4)";
    }
  };

  if (!textareaRef.current) return null;

  return (
    <>
      {/* Hidden canvas for text measurements */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={100}
        height={100}
      />
      
      {/* Highlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: "16px",
          lineHeight: "1.7",
        }}
      >
        {highlightBoxes.map((box) => (
          <div
            key={box.id}
            className="absolute rounded-sm transition-all duration-200 pointer-events-auto cursor-pointer hover:opacity-80"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              backgroundColor: getElementColor(box.type),
              border: `1px solid ${getBorderColor(box.type)}`,
            }}
            onClick={() => onElementClick?.(box.element)}
            title={`${box.type}: ${box.element.text.substring(0, 50)}...`}
          />
        ))}
      </div>
    </>
  );
} 