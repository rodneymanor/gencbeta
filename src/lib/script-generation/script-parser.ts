/**
 * Parser for extracting structured script elements from text
 */

interface ParsedScript {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

export class ScriptParser {
  /**
   * Parse a script string into structured elements
   * Handles multiple formats including labeled sections and plain text
   */
  static parse(scriptText: string): ParsedScript | null {
    if (!scriptText || typeof scriptText !== "string") {
      return null;
    }

    // Try to parse labeled format first (e.g., "HOOK: ...", "BRIDGE: ...")
    const labeled = this.parseLabeledFormat(scriptText);
    if (labeled) {
      return labeled;
    }

    // Try to parse paragraph-based format (4 paragraphs = 4 sections)
    const paragraphBased = this.parseParagraphFormat(scriptText);
    if (paragraphBased) {
      return paragraphBased;
    }

    // If all else fails, try to intelligently split based on content
    return this.parseIntelligentSplit(scriptText);
  }

  private static parseLabeledFormat(text: string): ParsedScript | null {
    // Try patterns with labels at the beginning like "HOOK: ..."
    const colonPatterns = {
      hook: /(?:HOOK|Hook):\s*(.+?)(?=\n\n|BRIDGE:|Bridge:|$)/is,
      bridge: /(?:BRIDGE|Bridge):\s*(.+?)(?=\n\n|GOLDEN NUGGET:|Golden Nugget:|$)/is,
      goldenNugget: /(?:GOLDEN NUGGET|Golden Nugget|NUGGET):\s*(.+?)(?=\n\n|CTA:|WTA:|$)/is,
      wta: /(?:CTA|WTA|Call to Action|What to Act):\s*(.+?)$/is,
    };

    const colonHook = text.match(colonPatterns.hook)?.[1]?.trim();
    const colonBridge = text.match(colonPatterns.bridge)?.[1]?.trim();
    const colonGoldenNugget = text.match(colonPatterns.goldenNugget)?.[1]?.trim();
    const colonWta = text.match(colonPatterns.wta)?.[1]?.trim();

    if (colonHook && colonBridge && colonGoldenNugget && colonWta) {
      return {
        hook: this.cleanText(colonHook),
        bridge: this.cleanText(colonBridge),
        goldenNugget: this.cleanText(colonGoldenNugget),
        wta: this.cleanText(colonWta),
      };
    }

    // Parse content with inline labels like "(Hook)" more robustly
    const sections: ParsedScript = {
      hook: "",
      bridge: "",
      goldenNugget: "",
      wta: "",
    };

    // Handle case where the text might have the format:
    // "Writer's block got you stuck? Don't ditch that video idea just yet; most creators face this wall. (Bridge)
    // Try this: record yourself... (Golden Nugget)
    // Share this tip! (CTA)"

    // This means the first line contains BOTH the hook and bridge label
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length >= 3) {
      // Check if first line ends with (Bridge)
      if (lines[0].endsWith("(Bridge)")) {
        // The hook is everything before the bridge label
        const firstLineParts = lines[0].match(/^(.*?)\s+([^.!?]+(?:[.!?]\s*[^.!?]+)*)\s*\(Bridge\)$/);
        if (firstLineParts) {
          sections.hook = firstLineParts[1].trim();
          sections.bridge = firstLineParts[2].trim();
        } else {
          // Fallback: just remove the (Bridge) label
          sections.hook = lines[0].replace(/\s*\(Bridge\)\s*$/, "").trim();
        }
      }

      // Process remaining lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("(Golden Nugget)") && !sections.goldenNugget) {
          sections.goldenNugget = line.replace(/\s*\(Golden Nugget\)\s*/i, "").trim();
        } else if ((line.includes("(CTA)") || line.includes("(WTA)")) && !sections.wta) {
          sections.wta = line.replace(/\s*\((CTA|WTA)\)\s*/i, "").trim();
        }
      }
    } else {
      // Fallback to original line-by-line parsing
      for (const line of lines) {
        if (line.includes("(Hook)") && !sections.hook) {
          sections.hook = line.replace(/\s*\(Hook\)\s*/i, "").trim();
        } else if (line.includes("(Bridge)") && !sections.bridge) {
          sections.bridge = line.replace(/\s*\(Bridge\)\s*/i, "").trim();
        } else if (line.includes("(Golden Nugget)") && !sections.goldenNugget) {
          sections.goldenNugget = line.replace(/\s*\(Golden Nugget\)\s*/i, "").trim();
        } else if ((line.includes("(CTA)") || line.includes("(WTA)")) && !sections.wta) {
          sections.wta = line.replace(/\s*\((CTA|WTA)\)\s*/i, "").trim();
        }
      }
    }

    // If we found all sections, return them
    if (sections.hook && sections.bridge && sections.goldenNugget && sections.wta) {
      return sections;
    }

    // Try a more flexible approach for content that may have labels anywhere
    const content = text;

    // Extract content between labels
    const hookMatch = content.match(/^(.*?)\s*\(Hook\)/i);
    const bridgeMatch = content.match(/\(Hook\)\s*(.*?)\s*\(Bridge\)/i);
    const nuggetMatch = content.match(/\(Bridge\)\s*(.*?)\s*\(Golden Nugget\)/i);
    const wtaMatch = content.match(/\(Golden Nugget\)\s*(.*?)\s*\((CTA|WTA)\)/i);

    if (hookMatch && bridgeMatch && nuggetMatch && wtaMatch) {
      return {
        hook: this.cleanText(hookMatch[1]),
        bridge: this.cleanText(bridgeMatch[1]),
        goldenNugget: this.cleanText(nuggetMatch[1]),
        wta: this.cleanText(wtaMatch[1]),
      };
    }

    return null;
  }

  private static parseParagraphFormat(text: string): ParsedScript | null {
    // Remove (Pause) markers for cleaner parsing
    const cleanText = text.replace(/\(Pause\)/gi, "").trim();

    // Split by double newlines or periods followed by significant whitespace
    const paragraphs = cleanText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length >= 4) {
      // Take first 4 paragraphs as hook, bridge, golden nugget, and wta
      return {
        hook: this.cleanText(paragraphs[0]),
        bridge: this.cleanText(paragraphs[1]),
        goldenNugget: this.cleanText(paragraphs.slice(2, -1).join(" ")),
        wta: this.cleanText(paragraphs[paragraphs.length - 1]),
      };
    }

    return null;
  }

  private static parseIntelligentSplit(text: string): ParsedScript {
    // Remove (Pause) markers
    const cleanText = text.replace(/\(Pause\)/gi, "").trim();

    // Split into sentences
    const sentences = cleanText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) {
      return {
        hook: "",
        bridge: "",
        goldenNugget: "",
        wta: "",
      };
    }

    // Estimate distribution based on typical script structure
    const totalSentences = sentences.length;

    // Hook: Usually 1-2 sentences (opening question or statement)
    const hookEnd = Math.min(2, Math.ceil(totalSentences * 0.2));

    // Bridge: Usually 1-2 sentences
    const bridgeEnd = hookEnd + Math.min(2, Math.ceil(totalSentences * 0.2));

    // WTA: Usually last 1-2 sentences
    const wtaStart = Math.max(bridgeEnd + 1, totalSentences - 2);

    return {
      hook: this.cleanText(sentences.slice(0, hookEnd).join(" ")),
      bridge: this.cleanText(sentences.slice(hookEnd, bridgeEnd).join(" ")),
      goldenNugget: this.cleanText(sentences.slice(bridgeEnd, wtaStart).join(" ")),
      wta: this.cleanText(sentences.slice(wtaStart).join(" ")),
    };
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\(Pause\)/gi, "")
      .replace(/\(\d+\)/g, "") // Remove word count markers like (5)
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Extract script from various response formats
   */
  static extractScriptContent(response: any): string | ParsedScript | null {
    // If it's already a string, return it
    if (typeof response === "string") {
      return response;
    }

    // If it has a script property with structured elements
    if (response?.script && typeof response.script === "object") {
      if (response.script.hook && response.script.bridge) {
        return response.script;
      }
    }

    // If it has content property
    if (response?.content) {
      if (typeof response.content === "string") {
        return response.content;
      }
      if (typeof response.content === "object" && response.content.script) {
        return response.content.script;
      }
    }

    // If it has elements property
    if (response?.elements) {
      if (typeof response.elements === "string") {
        return response.elements;
      }
      if (typeof response.elements === "object" && response.elements.hook) {
        return response.elements;
      }
    }

    return null;
  }
}
