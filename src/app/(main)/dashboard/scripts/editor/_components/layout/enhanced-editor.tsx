"use client";

import { useState, useEffect, useRef } from "react";


import { 
  enhanceHook, 
  strengthenBridge, 
  amplifyGoldenNugget, 
  optimizeCTA,
  analyzeElement,
  generateAlternatives
} from "@/lib/script-element-actions";

import { EditorSidebar } from "./editor-sidebar";
import { EditorToolbar } from "./editor-toolbar";
import { ReadabilitySidebar } from "./readability-sidebar";
import { HighlightOverlay } from "./highlight-overlay";
import { type ScriptElementType } from "./contextual-menu";

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

  // Handle element actions from contextual menu
  const handleElementAction = async (action: string, elementType: ScriptElementType, elementText: string) => {
    console.log('Element action:', action, elementType, elementText);
    
    try {
      let result;
      
      switch (action) {
        case 'enhance': {
          if (elementType === 'hook') {
            result = await enhanceHook(elementText);
          }
          break;
        }
        case 'strengthen': {
          if (elementType === 'bridge') {
            result = await strengthenBridge(elementText);
          }
          break;
        }
        case 'amplify': {
          if (elementType === 'golden-nugget') {
            result = await amplifyGoldenNugget(elementText);
          }
          break;
        }
        case 'optimize': {
          if (elementType === 'cta') {
            result = await optimizeCTA(elementText);
          }
          break;
        }
        case 'analyze': {
          const analysis = analyzeElement(elementType, elementText);
          console.log('Element analysis:', analysis);
          // Could show analysis in a dialog
          break;
        }
        case 'alternatives': {
          result = await generateAlternatives(elementType, elementText);
          console.log('Generated alternatives:', result);
          break;
        }
        case 'copy': {
          await navigator.clipboard.writeText(elementText);
          break;
        }
        case 'edit': {
          // Focus on the text area and select the element text
          if (textareaRef.current) {
            const startIndex = script.indexOf(elementText);
            if (startIndex !== -1) {
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(startIndex, startIndex + elementText.length);
            }
          }
          break;
        }
        case 'delete': {
          // Remove the element text from script
          const newScript = script.replace(elementText, '');
          handleScriptChange(newScript);
          break;
        }
      }
      
      // If we got a result with enhanced text, replace it in the script
      if (result?.success && result.result) {
        const newScript = script.replace(elementText, result.result);
        handleScriptChange(newScript);
      }
    } catch (error) {
      console.error('Failed to handle element action:', error);
    }
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

          {/* Enhanced Highlight Overlay with Contextual Menus */}
          <HighlightOverlay
            text={script}
            highlightSettings={highlightSettings}
            onElementAction={handleElementAction}
          />
        </div>
      </div>

      {/* Right Sidebar - Readability Analysis */}
      <ReadabilitySidebar script={script} />
    </div>
  );
}
