"use client";

import { useState, useEffect, useRef } from "react";

import { EditorSidebar } from "./editor-sidebar";
import { EditorToolbar } from "./editor-toolbar";

interface EnhancedEditorProps {
  initialScript?: string;
  onScriptChange?: (script: string) => void;
  onSave?: (script: string) => void;
}

export function EnhancedEditor({ initialScript = "", onScriptChange, onSave }: EnhancedEditorProps) {
  const [script, setScript] = useState(initialScript);
  const [highlightSettings, setHighlightSettings] = useState({
    hooks: true,
    bridges: true,
    goldenNuggets: true,
    ctas: true,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update parent when script changes
  useEffect(() => {
    onScriptChange?.(script);
  }, [script, onScriptChange]);

  const handleScriptChange = (value: string) => {
    setScript(value);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(script);
    }
  };

  const handleHighlightToggle = (type: keyof typeof highlightSettings) => {
    setHighlightSettings((prev) => {
      const newSettings = { ...prev };
      newSettings[type] = !newSettings[type];
      return newSettings;
    });
  };

  // Apply highlighting to the text
  const getHighlightedText = () => {
    if (!script) return "";

    let highlightedText = script;

    // Apply highlighting based on settings
    if (highlightSettings.hooks) {
      highlightedText = highlightedText.replace(
        /\b(imagine|what if|did you know|here's why|the secret|shocking|amazing|incredible)\b/gi,
        '<span class="bg-orange-500/20 text-orange-700 px-1 rounded">$1</span>',
      );
    }

    if (highlightSettings.bridges) {
      highlightedText = highlightedText.replace(
        /\b(but|however|now|so|because|that's why|here's the thing)\b/gi,
        '<span class="bg-cyan-500/20 text-cyan-700 px-1 rounded">$1</span>',
      );
    }

    if (highlightSettings.goldenNuggets) {
      highlightedText = highlightedText.replace(
        /\b(fact|tip|secret|trick|hack|pro tip|remember|key point)\b/gi,
        '<span class="bg-blue-500/20 text-blue-700 px-1 rounded">$1</span>',
      );
    }

    if (highlightSettings.ctas) {
      highlightedText = highlightedText.replace(
        /\b(subscribe|like|comment|share|follow|click|buy|get|download|sign up)\b/gi,
        '<span class="bg-green-500/20 text-green-700 px-1 rounded">$1</span>',
      );
    }

    return highlightedText;
  };

  return (
    <div className="bg-background flex h-screen">
      {/* Sidebar */}
      <EditorSidebar script={script} highlightSettings={highlightSettings} onHighlightToggle={handleHighlightToggle} />

      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <EditorToolbar script={script} onSave={handleSave} />

        {/* Editor Content */}
        <div className="relative flex-1">
          {/* Highlighted Text Overlay */}
          <div
            className="pointer-events-none absolute inset-0 p-6 break-words whitespace-pre-wrap text-transparent"
            style={{
              font: "inherit",
              fontSize: "16px",
              lineHeight: "1.7",
              fontFamily: "Inter, sans-serif",
              zIndex: 1,
            }}
            dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={script}
            onChange={(e) => handleScriptChange(e.target.value)}
            placeholder="Start writing your script here..."
            className="text-foreground placeholder:text-muted-foreground relative z-10 h-full w-full resize-none border-0 bg-transparent p-6 focus:outline-none"
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              fontFamily: "Inter, sans-serif",
              caretColor: "currentColor",
            }}
          />
        </div>
      </div>
    </div>
  );
}
