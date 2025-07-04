"use client";

import { useState, useEffect, useRef } from "react";

import { analyzeReadability } from "@/lib/readability-analysis";

import { EditorSidebar } from "./editor-sidebar";
import { EditorToolbar } from "./editor-toolbar";
import { ReadabilitySidebar } from "./readability-sidebar";

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
    readability: true,
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

  const handleHighlightToggle = (type: string) => {
    if (type in highlightSettings) {
      setHighlightSettings((prev) => ({
        ...prev,
        [type]: !prev[type as keyof typeof prev],
      }));
    }
  };

  // Analyze sentence readability
  const getSentenceReadabilityColor = (sentence: string): string => {
    if (!sentence.trim() || sentence.length < 10) return "";

    try {
      const analysis = analyzeReadability(sentence);
      const score = analysis.readabilityLevel.score;

      if (score >= 80) return "bg-green-100/30"; // Very easy
      if (score >= 70) return "bg-emerald-100/30"; // Easy
      if (score >= 60) return "bg-yellow-100/30"; // Standard
      if (score >= 50) return "bg-orange-100/30"; // Fairly difficult
      if (score >= 30) return "bg-red-100/30"; // Difficult
      return "bg-rose-100/30"; // Very difficult
    } catch {
      return "";
    }
  };

  // Apply readability highlighting
  const applyReadabilityHighlighting = (text: string): string => {
    const sentences = text.split(/([.!?]+)/);
    let processedText = "";

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || "";

      if (sentence && sentence.trim()) {
        const readabilityClass = getSentenceReadabilityColor(sentence);
        if (readabilityClass) {
          processedText += `<span class="${readabilityClass} px-1 rounded">${sentence}</span>${punctuation}`;
        } else {
          processedText += sentence + punctuation;
        }
      } else {
        processedText += sentence + punctuation;
      }
    }

    return processedText;
  };

  // Apply script element highlighting
  const applyScriptElementHighlighting = (text: string): string => {
    let highlightedText = text;

    if (highlightSettings.hooks) {
      highlightedText = highlightedText.replace(
        /\b(imagine|what if|did you know|here's why|the secret|shocking|amazing|incredible)\b/gi,
        '<span class="bg-orange-500/40 text-orange-800 px-1 rounded font-medium">$1</span>',
      );
    }

    if (highlightSettings.bridges) {
      highlightedText = highlightedText.replace(
        /\b(but|however|now|so|because|that's why|here's the thing)\b/gi,
        '<span class="bg-cyan-500/40 text-cyan-800 px-1 rounded font-medium">$1</span>',
      );
    }

    if (highlightSettings.goldenNuggets) {
      highlightedText = highlightedText.replace(
        /\b(fact|tip|secret|trick|hack|pro tip|remember|key point)\b/gi,
        '<span class="bg-blue-500/40 text-blue-800 px-1 rounded font-medium">$1</span>',
      );
    }

    if (highlightSettings.ctas) {
      highlightedText = highlightedText.replace(
        /\b(subscribe|like|comment|share|follow|click|buy|get|download|sign up)\b/gi,
        '<span class="bg-green-500/40 text-green-800 px-1 rounded font-medium">$1</span>',
      );
    }

    return highlightedText;
  };

  // Apply highlighting to the text
  const getHighlightedText = () => {
    if (!script) return "";

    let highlightedText = script;

    // Apply readability highlighting first (sentence-level)
    if (highlightSettings.readability) {
      highlightedText = applyReadabilityHighlighting(highlightedText);
    }

    // Apply script element highlighting on top
    highlightedText = applyScriptElementHighlighting(highlightedText);

    return highlightedText;
  };

  return (
    <div className="bg-background flex h-screen">
      {/* Left Sidebar - Writing Tools */}
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

      {/* Right Sidebar - Readability Analysis */}
      <ReadabilitySidebar script={script} />
    </div>
  );
}
