export const DEFAULT_NEGATIVE_KEYWORDS = [
  // Most Commonly Cited Overused Terms
  "a testament to",
  "bustling",
  "comprehensive",
  "crucial",
  "delve",
  "embark",
  "furthermore",
  "harness the power of",
  "in the world of",
  "landscape",
  "leverage",
  "meticulous",
  "navigate the complexities",
  "pivotal",
  "realm",
  "robust",
  "seamlessly",
  "showcasing",
  "tapestry",
  "unlock the potential of",
  "vibrant",

  // Transition and Connector Words
  "additionally",
  "accordingly",
  "also",
  "as a result",
  "consequently",
  "hence",
  "however",
  "indeed",
  "moreover",
  "nonetheless",
  "notably",
  "subsequently",
  "therefore",
  "thus",

  // Filler and Hedging Phrases
  "all things considered",
  "arguably",
  "for instance",
  "in conclusion",
  "in essence",
  "in summary",
  "it can be argued",
  "it is important to note",
  "it is worth noting that",
  "it's important to note",
  "it's worth mentioning that",
  "needless to say",
  "on the other hand",
  "to put it simply",
  "to sum up",
  "you may want to",

  // Formal/Academic Language
  "ascertain",
  "augment",
  "commendable",
  "demonstrate",
  "elucidate",
  "exemplary",
  "facilitate",
  "in-depth",
  "innovative",
  "paradigm",
  "plethora",
  "proficiency",
  "underscores",
  "utilize",

  // Metaphorical/Descriptive Terms
  "beacon",
  "cornerstone",
  "crucible",
  "dance",
  "deep dive",
  "drowning",
  "enigma",
  "ever-evolving",
  "game-changer",
  "indelible",
  "kaleidoscope",
  "labyrinth",
  "melody",
  "metamorphosis",
  "symphony",
  "treasure trove",
  "whispering",

  // Additional Common Terms
  "actionable insights",
  "aligns",
  "aims to explore",
  "as a professional",
  "bearing in mind that",
  "breakthrough",
  "bridging the gap",
  "capitalize on the opportunities",
  "cutting-edge",
  "daunting",
  "debunk",
  "designed to enhance",
  "dive into",
  "drive insightful data-driven decisions",
  "elevate",
  "embark on a journey",
  "enable",
  "ensure",
  "essential",
  "everchanging",
  "excels",
  "feel free to",
  "folks",
  "foster",
  "foster a culture of",
  "game changer",
  "given the fact that",
  "gossamer",
  "groundbreaking",
  "harness",
  "holistic",
  "hustle and bustle",
  "i hope this helps",
  "imagine",
  "impactful",
  "in today's digital age",
  "intricate",
  "journey",
  "keen",
  "killer",
  "lay the groundwork for",
  "making waves",
  "mark a significant step forward",
  "master",
  "myriad",
  "navigating the landscape",
  "nestled",
  "new normal",
  "not only... but also",
  "notable works include",
  "opens up exciting possibilities",
  "out of the box",
  "pave the way for",
  "pesky",
  "play a significant role",
  "poised to",
  "possibilities are endless",
  "power",
  "promptly",
  "push the boundaries of",
  "rapidly evolving",
  "realm of possibility",
  "remember that",
  "remnant",
  "resonates",
  "rest assured",
  "revolutionize",
  "safeguard",
  "seamless integration",
  "shedding light on",
  "significant strides",
  "soul",
  "spearhead",
  "stand the test of time",
  "strides",
  "stunning",
  "supercharge",
  "sure",
  "synergy",
  "that being said",
  "the new frontier",
  "thrive",
  "touch base",
  "trailblazing",
  "transformative",
  "unleash",
  "unlock",
  "unprecedented",
  "vital",
  "welcome your thoughts",
  "when it comes to",
  "yield",
];

export interface NegativeKeywordSettings {
  defaultKeywords: string[];
  userRemovedKeywords: string[];
  userAddedKeywords: string[];
}

export interface UserNegativeKeywords {
  id?: string;
  userId: string;
  settings: NegativeKeywordSettings;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the effective negative keywords for a user
 * (default keywords minus removed keywords plus added keywords)
 */
export function getEffectiveNegativeKeywords(settings: NegativeKeywordSettings): string[] {
  const defaultKeywords = DEFAULT_NEGATIVE_KEYWORDS.filter(
    (keyword) => !settings.userRemovedKeywords.includes(keyword),
  );

  return [...defaultKeywords, ...settings.userAddedKeywords];
}

/**
 * Check if text contains any negative keywords
 */
export function detectNegativeKeywords(
  text: string,
  negativeKeywords: string[],
): {
  hasNegativeKeywords: boolean;
  detectedKeywords: string[];
  highlightedText: string;
} {
  const detectedKeywords: string[] = [];
  let highlightedText = text;

  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();

  negativeKeywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();

    // Check for exact word matching (with word boundaries)
    const escapedKeyword = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi");

    if (regex.test(lowerText)) {
      detectedKeywords.push(keyword);

      // Highlight the detected keywords in the original text
      highlightedText = highlightedText.replace(regex, `<mark class="negative-keyword">$&</mark>`);
    }
  });

  return {
    hasNegativeKeywords: detectedKeywords.length > 0,
    detectedKeywords,
    highlightedText,
  };
}

/**
 * Create prompt instruction for avoiding negative keywords
 */
export function createNegativeKeywordPromptInstruction(negativeKeywords: string[]): string {
  if (negativeKeywords.length === 0) {
    return "";
  }

  return `

CRITICAL CONTENT RESTRICTION:
You MUST avoid using any of the following overused words and phrases in your response. These words make content sound robotic and AI-generated:

${negativeKeywords.map((keyword) => `- "${keyword}"`).join("\n")}

Instead, use natural, conversational language that sounds human and authentic. Choose simpler, more direct alternatives that a real person would use in everyday conversation.`;
}
