"use client";

import { useEffect, useRef, useState } from "react";

import { type PartialBlock } from "@blocknote/core";

import { type ScriptElement } from "@/lib/script-analysis";

interface ScriptBlock {
  type: "hook" | "bridge" | "golden-nugget" | "wta";
  label: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

interface ScriptBlocksOverlayProps {
  blocks: PartialBlock[];
  onBlockClick: (block: ScriptBlock, event: React.MouseEvent) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

export function ScriptBlocksOverlay({ blocks, onBlockClick, editorRef }: ScriptBlocksOverlayProps) {
  const [scriptBlocks, setScriptBlocks] = useState<ScriptBlock[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Convert BlockNote blocks to script blocks for highlighting
  useEffect(() => {
    if (!blocks || blocks.length === 0) {
      setScriptBlocks([]);
      return;
    }

    const scriptBlockTypes: Array<ScriptBlock["type"]> = ["hook", "bridge", "golden-nugget", "wta"];
    const scriptBlockLabels = ["Hook", "Bridge", "Golden Nugget", "WTA"];

    const scriptBlocks: ScriptBlock[] = [];

    // Create a full text representation to calculate proper indices
    const fullText = blocks
      .filter((block) => block.type === "paragraph" && block.content)
      .map((block) => {
        const blockText = Array.isArray(block.content)
          ? block.content.map((item) => (typeof item === "string" ? item : ((item as any)?.text ?? ""))).join("")
          : String(block.content);
        return blockText.trim();
      })
      .join("\n\n"); // Double newlines between blocks

    let currentIndex = 0;

    blocks.forEach((block, index) => {
      if (block.type === "paragraph" && block.content) {
        // Extract text content from BlockNote block
        const blockText = Array.isArray(block.content)
          ? block.content.map((item) => (typeof item === "string" ? item : ((item as any)?.text ?? ""))).join("")
          : String(block.content);

        if (blockText.trim()) {
          // Use the block index to determine component type (up to 4 blocks)
          const blockTypeIndex = Math.min(index, 3);
          const trimmedText = blockText.trim();

          const scriptBlock: ScriptBlock = {
            type: scriptBlockTypes[blockTypeIndex],
            label: scriptBlockLabels[blockTypeIndex],
            text: trimmedText,
            startIndex: fullText.indexOf(trimmedText, currentIndex),
            endIndex: fullText.indexOf(trimmedText, currentIndex) + trimmedText.length,
          };

          scriptBlocks.push(scriptBlock);
          currentIndex = scriptBlock.endIndex + 2; // Move past this block + double newlines
        }
      }
    });

    setScriptBlocks(scriptBlocks);
  }, [blocks]);

  // Calculate block positions using text-based approach (working version)
  const [blockPositions, setBlockPositions] = useState<Array<{ block: ScriptBlock; rect: DOMRect }>>([]);

  useEffect(() => {
    if (!editorRef.current || scriptBlocks.length === 0) {
      setBlockPositions([]);
      return;
    }

    const updatePositions = () => {
      const positions: Array<{ block: ScriptBlock; rect: DOMRect }> = [];
      const editorElement = editorRef.current;
      if (!editorElement) return;

      scriptBlocks.forEach((block) => {
        try {
          const textContent = editorElement.textContent || "";
          const blockIndex = textContent.indexOf(block.text);

          if (blockIndex !== -1) {
            const range = document.createRange();
            const walker = document.createTreeWalker(editorElement, NodeFilter.SHOW_TEXT, null);

            let currentIndex = 0;
            let textNode = walker.nextNode();

            while (textNode && currentIndex < blockIndex + block.text.length) {
              const nodeText = textNode.textContent || "";
              const nodeEndIndex = currentIndex + nodeText.length;

              if (blockIndex >= currentIndex && blockIndex < nodeEndIndex) {
                const startOffset = blockIndex - currentIndex;
                const endOffset = Math.min(startOffset + block.text.length, nodeText.length);

                range.setStart(textNode, startOffset);

                // Find the end position
                let endNode = textNode;
                let endOffsetFinal = endOffset;
                let remainingLength = block.text.length - (endOffset - startOffset);

                while (remainingLength > 0 && walker.nextNode()) {
                  const nextNode = walker.currentNode;
                  const nextText = nextNode.textContent || "";

                  if (remainingLength >= nextText.length) {
                    remainingLength -= nextText.length;
                    endNode = nextNode;
                    endOffsetFinal = nextText.length;
                  } else {
                    endNode = nextNode;
                    endOffsetFinal = remainingLength;
                    remainingLength = 0;
                  }
                }

                range.setEnd(endNode, endOffsetFinal);

                const rect = range.getBoundingClientRect();
                const editorRect = editorElement.getBoundingClientRect();

                // Convert to relative coordinates
                const relativeRect = new DOMRect(
                  rect.left - editorRect.left,
                  rect.top - editorRect.top,
                  rect.width,
                  rect.height,
                );

                positions.push({ block, rect: relativeRect });
                break;
              }

              currentIndex = nodeEndIndex;
              textNode = walker.nextNode();
            }
          }
        } catch (error) {
          console.warn("Failed to calculate position for block:", block, error);
        }
      });

      setBlockPositions(positions);
    };

    // Initial update
    updatePositions();

    // Update on resize
    const handleResize = () => updatePositions();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [scriptBlocks, editorRef]);

  const getBlockColor = (type: ScriptBlock["type"]) => {
    switch (type) {
      case "hook":
        return "hover:shadow-md hover:bg-orange-50/50 border-orange-200/50";
      case "bridge":
        return "hover:shadow-md hover:bg-blue-50/50 border-blue-200/50";
      case "golden-nugget":
        return "hover:shadow-md hover:bg-yellow-50/50 border-yellow-200/50";
      case "wta":
        return "hover:shadow-md hover:bg-green-50/50 border-green-200/50";
      default:
        return "hover:shadow-md hover:bg-gray-50/50 border-gray-200/50";
    }
  };

  const handleBlockClick = (block: ScriptBlock, event: React.MouseEvent) => {
    onBlockClick(block, event);
  };

  return (
    <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-10" style={{ pointerEvents: "none" }}>
      {blockPositions.map((position, index) => (
        <div
          key={`${position.block.type}-${index}`}
          className={`pointer-events-auto absolute cursor-pointer rounded-sm border transition-all duration-200 ${getBlockColor(position.block.type)}`}
          style={{
            left: position.rect.left,
            top: position.rect.top,
            width: position.rect.width,
            height: position.rect.height,
            pointerEvents: "auto",
          }}
          onClick={(event) => handleBlockClick(position.block, event)}
          title={`Click to edit ${position.block.label}`}
        />
      ))}
    </div>
  );
}
