"use client";

import { useEffect, useRef, useState } from "react";

import Split from "react-split";

interface SplitLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultSizes?: [number, number];
  minSizes?: [number, number];
  maxSizes?: [number, number];
  className?: string;
}

export function SplitLayout({
  leftPanel,
  rightPanel,
  defaultSizes = [40, 60],
  minSizes = [300, 400],
  maxSizes = [600, Infinity],
  className = "",
}: SplitLayoutProps) {
  const [sizes, setSizes] = useState<[number, number]>(defaultSizes);
  const splitRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (splitRef.current) {
        // Force Split component to recalculate sizes
        const event = new Event("resize");
        window.dispatchEvent(event);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save sizes to localStorage
  useEffect(() => {
    const savedSizes = localStorage.getItem("script-editor-split-sizes");
    if (savedSizes) {
      try {
        const parsed = JSON.parse(savedSizes) as [number, number];
        setSizes(parsed);
      } catch (error) {
        console.warn("Failed to parse saved split sizes:", error);
      }
    }
  }, []);

  const handleSizeChange = (newSizes: number[]) => {
    const typedSizes = newSizes as [number, number];
    setSizes(typedSizes);
    localStorage.setItem("script-editor-split-sizes", JSON.stringify(typedSizes));
  };

  return (
    <div ref={splitRef} className={`split-pane-container h-full ${className}`}>
      <Split
        sizes={sizes}
        minSize={minSizes}
        maxSize={maxSizes}
        expandToMin={false}
        gutterSize={8}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="horizontal"
        cursor="col-resize"
        onDragEnd={handleSizeChange}
        className="flex h-full"
        style={{ height: "100%" }}
      >
        <div className="flex h-full flex-col overflow-hidden">{leftPanel}</div>
        <div className="flex h-full flex-col overflow-hidden">{rightPanel}</div>
      </Split>
    </div>
  );
}
