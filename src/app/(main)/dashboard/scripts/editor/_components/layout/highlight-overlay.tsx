'use client';

import { useState, useEffect, useMemo } from 'react';
import { analyzeReadabilityHighlighting, type SentenceHighlight } from '@/lib/readability-highlighting';
import { ContextualMenu, type ScriptElementType } from './contextual-menu';

interface ScriptElement {
  type: ScriptElementType;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

interface HighlightSettings {
  hooks: boolean;
  bridges: boolean;
  goldenNuggets: boolean;
  ctas: boolean;
  readability: boolean;
}

interface HighlightOverlayProps {
  text: string;
  highlightSettings: HighlightSettings;
  onElementAction: (action: string, elementType: ScriptElementType, text: string) => void;
}

// Script element detection patterns
const SCRIPT_PATTERNS = {
  hook: [
    /^(did you know|imagine|what if|here's the thing|let me tell you|picture this|you won't believe|stop what you're doing)/i,
    /(shocking|amazing|incredible|unbelievable|mind-blowing|jaw-dropping)/i,
    /^(listen up|pay attention|check this out|get this|wait for it)/i,
  ],
  bridge: [
    /(but here's the thing|now here's where it gets interesting|but wait|however|meanwhile|on the other hand)/i,
    /(this is where|this leads to|which brings us to|speaking of|that reminds me)/i,
    /(let me explain|here's why|the reason is|what this means)/i,
  ],
  'golden-nugget': [
    /(the secret is|here's the key|the truth is|what most people don't know)/i,
    /(pro tip|insider secret|game changer|breakthrough|revelation)/i,
    /(most important|crucial|essential|vital|critical)/i,
  ],
  cta: [
    /(click|tap|swipe|follow|subscribe|like|share|comment|save)/i,
    /(don't forget to|make sure to|remember to|be sure to)/i,
    /(check out|go to|visit|download|get|try|start)/i,
  ],
} as const;

/**
 * Detect script elements in text
 */
function detectScriptElements(text: string): ScriptElement[] {
  const elements: ScriptElement[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentIndex = 0;
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length === 0) continue;
    
    const startIndex = text.indexOf(trimmedSentence, currentIndex);
    const endIndex = startIndex + trimmedSentence.length;
    
    // Check each pattern type
    for (const [elementType, patterns] of Object.entries(SCRIPT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(trimmedSentence)) {
          elements.push({
            type: elementType as ScriptElementType,
            text: trimmedSentence,
            start: startIndex,
            end: endIndex,
            confidence: 0.8, // Could be enhanced with ML
          });
          break; // Only assign one type per sentence
        }
      }
    }
    
    currentIndex = endIndex;
  }
  
  return elements;
}

/**
 * Check if script element should be included based on settings
 */
function shouldIncludeElement(element: ScriptElement, settings: HighlightSettings): boolean {
  return (
    (element.type === 'hook' && settings.hooks) ||
    (element.type === 'bridge' && settings.bridges) ||
    (element.type === 'golden-nugget' && settings.goldenNuggets) ||
    (element.type === 'cta' && settings.ctas)
  );
}

/**
 * Add script elements to combined highlights
 */
function addScriptElements(
  combined: Array<{ start: number; end: number; type: 'script' | 'readability'; data: unknown }>,
  scriptElements: ScriptElement[],
  settings: HighlightSettings
): void {
  if (settings.hooks || settings.bridges || settings.goldenNuggets || settings.ctas) {
    for (const element of scriptElements) {
      if (shouldIncludeElement(element, settings)) {
        combined.push({
          start: element.start,
          end: element.end,
          type: 'script',
          data: element
        });
      }
    }
  }
}

/**
 * Add readability highlights to combined highlights
 */
function addReadabilityHighlights(
  combined: Array<{ start: number; end: number; type: 'script' | 'readability'; data: unknown }>,
  readabilityHighlights: SentenceHighlight[],
  settings: HighlightSettings
): void {
  if (settings.readability) {
    for (const highlight of readabilityHighlights) {
      combined.push({
        start: highlight.start,
        end: highlight.end,
        type: 'readability',
        data: highlight
      });
    }
  }
}

/**
 * Combine script elements and readability highlights
 */
function combineHighlights(
  text: string,
  scriptElements: ScriptElement[],
  readabilityHighlights: SentenceHighlight[],
  settings: HighlightSettings
): Array<{ start: number; end: number; type: 'script' | 'readability'; data: unknown }> {
  const combined: Array<{ start: number; end: number; type: 'script' | 'readability'; data: unknown }> = [];
  
  // Add script elements if enabled
  addScriptElements(combined, scriptElements, settings);
  
  // Add readability highlights if enabled
  addReadabilityHighlights(combined, readabilityHighlights, settings);
  
  // Sort by start position
  combined.sort((a, b) => a.start - b.start);
  
  return combined;
}

/**
 * Generate highlighted HTML
 */
function generateHighlightedHTML(
  text: string,
  highlights: Array<{ start: number; end: number; type: 'script' | 'readability'; data: unknown }>
): string {
  if (highlights.length === 0) return text;
  
  let html = '';
  let lastIndex = 0;
  
  for (const highlight of highlights) {
    // Add text before highlight
    if (highlight.start > lastIndex) {
      html += text.slice(lastIndex, highlight.start);
    }
    
    const highlightText = text.slice(highlight.start, highlight.end);
    
    if (highlight.type === 'script') {
      const element = highlight.data as ScriptElement;
      const colors = {
        hook: 'bg-yellow-100 border-yellow-300 text-yellow-800',
        bridge: 'bg-blue-100 border-blue-300 text-blue-800',
        'golden-nugget': 'bg-orange-100 border-orange-300 text-orange-800',
        cta: 'bg-green-100 border-green-300 text-green-800',
      };
      
      html += `<span class="script-element ${colors[element.type]} px-2 py-1 rounded-md border cursor-pointer hover:shadow-sm transition-all duration-200" data-element-type="${element.type}" data-element-text="${highlightText}" data-start="${highlight.start}" data-end="${highlight.end}">${highlightText}</span>`;
    } else {
      const readability = highlight.data as SentenceHighlight;
      html += `<span class="readability-highlight ${readability.bgColor} ${readability.color} px-1 py-0.5 rounded-sm transition-colors duration-200" data-score="${readability.score}" data-level="${readability.level}">${highlightText}</span>`;
    }
    
    lastIndex = highlight.end;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    html += text.slice(lastIndex);
  }
  
  return html;
}

export function HighlightOverlay({
  text,
  highlightSettings,
  onElementAction,
}: HighlightOverlayProps) {
  const [contextualMenu, setContextualMenu] = useState<{
    isVisible: boolean;
    elementType: ScriptElementType;
    elementText: string;
    position: { x: number; y: number };
  }>({
    isVisible: false,
    elementType: 'hook',
    elementText: '',
    position: { x: 0, y: 0 },
  });

  // Detect script elements
  const scriptElements = useMemo(() => detectScriptElements(text), [text]);

  // Analyze readability
  const readabilityResult = useMemo(() => 
    analyzeReadabilityHighlighting(text), [text]
  );

  // Combine highlights
  const combinedHighlights = useMemo(() => 
    combineHighlights(text, scriptElements, readabilityResult.sentences, highlightSettings),
    [text, scriptElements, readabilityResult.sentences, highlightSettings]
  );

  // Handle element clicks
  const handleElementClick = (element: ScriptElement, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextualMenu({
      isVisible: true,
      elementType: element.type,
      elementText: element.text,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  // Generate highlighted HTML
  const highlightedHTML = useMemo(() => 
    generateHighlightedHTML(text, combinedHighlights),
    [text, combinedHighlights]
  );

  // Handle contextual menu actions
  const handleContextualAction = (action: string, elementType: ScriptElementType, elementText: string) => {
    onElementAction(action, elementType, elementText);
  };

  // Handle clicks on script elements
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('script-element')) {
        const elementType = target.getAttribute('data-element-type') as ScriptElementType;
        const elementText = target.getAttribute('data-element-text') ?? '';
        
        const element: ScriptElement = {
          type: elementType,
          text: elementText,
          start: parseInt(target.getAttribute('data-start') ?? '0'),
          end: parseInt(target.getAttribute('data-end') ?? '0'),
          confidence: 0.8,
        };
        
        handleElementClick(element, event as any);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="relative">
      {/* Highlighted content overlay */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words font-mono text-sm leading-relaxed p-4"
        style={{ 
          color: 'transparent',
          zIndex: 1,
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHTML }}
      />
      
      {/* Clickable overlay for script elements */}
      <div 
        className="absolute inset-0 pointer-events-auto overflow-hidden whitespace-pre-wrap break-words font-mono text-sm leading-relaxed p-4"
        style={{ 
          color: 'transparent',
          zIndex: 2,
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHTML.replace(/class="readability-highlight[^"]*"/g, 'class="pointer-events-none"') }}
      />

      {/* Contextual Menu */}
      <ContextualMenu
        elementType={contextualMenu.elementType}
        elementText={contextualMenu.elementText}
        position={contextualMenu.position}
        isVisible={contextualMenu.isVisible}
        onClose={() => setContextualMenu(prev => ({ ...prev, isVisible: false }))}
        onAction={handleContextualAction}
      />
    </div>
  );
} 