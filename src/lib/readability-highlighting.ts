export interface SentenceHighlight {
  text: string;
  score: number;
  level: "easy" | "medium" | "hard";
  color: string;
  bgColor: string;
  start: number;
  end: number;
}

export interface ReadabilityHighlightResult {
  sentences: SentenceHighlight[];
  overallScore: number;
  wordCount: number;
}

/**
 * Split text into sentences using regex that handles common sentence endings
 */
function splitIntoSentences(text: string): Array<{ text: string; start: number; end: number }> {
  const sentences: Array<{ text: string; start: number; end: number }> = [];

  // Enhanced regex to handle various sentence endings
  const sentenceRegex = /[.!?]+(?:\s+|$)/g;
  let lastIndex = 0;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentenceText = text.slice(lastIndex, match.index + match[0].length).trim();

    if (sentenceText.length > 0) {
      sentences.push({
        text: sentenceText,
        start: lastIndex,
        end: match.index + match[0].length,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Handle any remaining text that doesn't end with punctuation
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText.length > 0) {
      sentences.push({
        text: remainingText,
        start: lastIndex,
        end: text.length,
      });
    }
  }

  return sentences;
}

/**
 * Calculate readability score for a single sentence
 */
function calculateSentenceScore(sentence: string): number {
  // Use simplified metrics for individual sentences
  const words = sentence.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  if (wordCount === 0) return 100;

  // Count syllables (simplified)
  const syllableCount = words.reduce((total, word) => {
    const syllables = word.toLowerCase().match(/[aeiouy]+/g);
    return total + (syllables ? syllables.length : 1);
  }, 0);

  // Count complex words (3+ syllables)
  const complexWords = words.filter((word) => {
    const syllables = word.toLowerCase().match(/[aeiouy]+/g);
    return syllables && syllables.length >= 3;
  }).length;

  // Calculate a simplified readability score
  // Based on word length, syllable density, and complex word ratio
  const avgWordsPerSentence = wordCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  const complexWordRatio = complexWords / wordCount;

  // Flesch-like formula adapted for single sentences
  let score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Adjust for complex words
  score -= complexWordRatio * 50;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get readability level and colors based on score
 */
function getReadabilityLevel(score: number): { level: "easy" | "medium" | "hard"; color: string; bgColor: string } {
  if (score >= 70) {
    return {
      level: "easy",
      color: "text-green-700",
      bgColor: "bg-green-100/50",
    };
  } else if (score >= 40) {
    return {
      level: "medium",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100/50",
    };
  } else {
    return {
      level: "hard",
      color: "text-red-700",
      bgColor: "bg-red-100/50",
    };
  }
}

/**
 * Analyze text and return sentence-level readability highlighting
 */
export function analyzeReadabilityHighlighting(text: string): ReadabilityHighlightResult {
  if (!text || text.trim().length === 0) {
    return {
      sentences: [],
      overallScore: 0,
      wordCount: 0,
    };
  }

  const sentences = splitIntoSentences(text);
  const highlights: SentenceHighlight[] = [];

  let totalScore = 0;
  let totalWords = 0;

  for (const sentence of sentences) {
    const score = calculateSentenceScore(sentence.text);
    const { level, color, bgColor } = getReadabilityLevel(score);
    const wordCount = sentence.text.split(/\s+/).filter((word) => word.length > 0).length;

    highlights.push({
      text: sentence.text,
      score,
      level,
      color,
      bgColor,
      start: sentence.start,
      end: sentence.end,
    });

    totalScore += score * wordCount; // Weight by word count
    totalWords += wordCount;
  }

  const overallScore = totalWords > 0 ? totalScore / totalWords : 0;

  return {
    sentences: highlights,
    overallScore,
    wordCount: totalWords,
  };
}

/**
 * Generate HTML with readability highlighting
 */
export function generateReadabilityHTML(text: string, highlights: SentenceHighlight[]): string {
  if (!text || highlights.length === 0) return text;

  let html = "";
  let lastIndex = 0;

  for (const highlight of highlights) {
    // Add any text before this highlight
    if (highlight.start > lastIndex) {
      html += text.slice(lastIndex, highlight.start);
    }

    // Add the highlighted sentence
    html += `<span class="readability-highlight ${highlight.bgColor} ${highlight.color} px-1 py-0.5 rounded-sm transition-colors duration-200" data-score="${highlight.score}" data-level="${highlight.level}">${highlight.text}</span>`;

    lastIndex = highlight.end;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    html += text.slice(lastIndex);
  }

  return html;
}

/**
 * Get readability statistics for highlighting
 */
export function getReadabilityStats(highlights: SentenceHighlight[]): {
  easy: number;
  medium: number;
  hard: number;
  total: number;
} {
  const stats = {
    easy: 0,
    medium: 0,
    hard: 0,
    total: highlights.length,
  };

  for (const highlight of highlights) {
    stats[highlight.level]++;
  }

  return stats;
}
