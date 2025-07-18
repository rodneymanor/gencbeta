/**
 * Hook Examples Library
 * Curated collection of proven hook patterns for AI prompt enhancement
 */

export interface HookExample {
  id: string;
  pattern: string;
  category: "speed" | "educational" | "viral";
  tone: string[];
  effectiveness: "high" | "medium" | "low";
  context: string;
  example: string;
}

export const HOOK_EXAMPLES: HookExample[] = [
  // Speed/Direct Hooks
  {
    id: "speed_knowledge_gap",
    pattern: "Here's something you need to know about {topic}",
    category: "speed",
    tone: ["direct", "urgent", "matter-of-fact", "casual"],
    effectiveness: "high",
    context: "Direct problem statement opener",
    example: "Here's something you need to know about productivity",
  },
  {
    id: "speed_misconception",
    pattern: "Most people get {topic} completely wrong",
    category: "speed",
    tone: ["confident", "authoritative", "casual"],
    effectiveness: "high",
    context: "Challenges common misconceptions",
    example: "Most people get networking completely wrong",
  },
  {
    id: "speed_secret_reveal",
    pattern: "The secret to {topic} that no one talks about",
    category: "speed",
    tone: ["intriguing", "exclusive", "casual"],
    effectiveness: "high",
    context: "Creates intrigue with insider knowledge",
    example: "The secret to public speaking that no one talks about",
  },
  {
    id: "speed_time_waste",
    pattern: "Stop wasting time with {topic} - here's what actually works",
    category: "speed",
    tone: ["urgent", "direct", "casual"],
    effectiveness: "high",
    context: "Creates urgency around efficiency",
    example: "Stop wasting time with morning routines - here's what actually works",
  },
  {
    id: "speed_uncomfortable_truth",
    pattern: "The uncomfortable truth about {topic} nobody mentions",
    category: "speed",
    tone: ["direct", "honest", "casual"],
    effectiveness: "high",
    context: "Promises honest, unfiltered insights",
    example: "The uncomfortable truth about social media nobody mentions",
  },
  {
    id: "speed_critical_mistake",
    pattern: "Before you try {topic}, avoid this critical mistake",
    category: "speed",
    tone: ["warning", "helpful", "casual"],
    effectiveness: "high",
    context: "Prevents common errors",
    example: "Before you try intermittent fasting, avoid this critical mistake",
  },
  {
    id: "speed_importance_reveal",
    pattern: "Here's why {topic} matters more than you think",
    category: "speed",
    tone: ["urgent", "compelling", "casual"],
    effectiveness: "medium",
    context: "Emphasizes unexpected importance",
    example: "Here's why sleep matters more than you think",
  },
  {
    id: "speed_reality_check",
    pattern: "The reality of {topic} vs what people think",
    category: "speed",
    tone: ["realistic", "direct", "casual"],
    effectiveness: "medium",
    context: "Contrasts perception with reality",
    example: "The reality of entrepreneurship vs what people think",
  },

  // Educational Hooks
  {
    id: "edu_curiosity_question",
    pattern: "Ever wondered why {topic} works the way it does?",
    category: "educational",
    tone: ["curious", "thoughtful", "casual"],
    effectiveness: "high",
    context: "Curiosity-driven question opener",
    example: "Ever wondered why some people are naturally charismatic?",
  },
  {
    id: "edu_breakdown_promise",
    pattern: "Let me break down {topic} in simple terms",
    category: "educational",
    tone: ["professional", "clear", "casual"],
    effectiveness: "high",
    context: "Promises clear explanation",
    example: "Let me break down cryptocurrency in simple terms",
  },
  {
    id: "edu_biggest_mistake",
    pattern: "The biggest mistake people make with {topic}",
    category: "educational",
    tone: ["helpful", "understanding", "casual"],
    effectiveness: "high",
    context: "Highlights common errors",
    example: "The biggest mistake people make with investing",
  },
  {
    id: "edu_research_surprise",
    pattern: "Research shows something surprising about {topic}",
    category: "educational",
    tone: ["authoritative", "professional", "casual"],
    effectiveness: "high",
    context: "Evidence-based opener",
    example: "Research shows something surprising about multitasking",
  },
  {
    id: "edu_hidden_understanding",
    pattern: "Here's what most people don't understand about {topic}",
    category: "educational",
    tone: ["comprehensive", "professional", "casual"],
    effectiveness: "high",
    context: "Promises deeper understanding",
    example: "Here's what most people don't understand about compound interest",
  },
  {
    id: "edu_system_approach",
    pattern: "The step-by-step system for mastering {topic}",
    category: "educational",
    tone: ["systematic", "clear", "casual"],
    effectiveness: "high",
    context: "Structured learning approach",
    example: "The step-by-step system for mastering public speaking",
  },
  {
    id: "edu_foundation_first",
    pattern: "Before you advance in {topic}, master these fundamentals",
    category: "educational",
    tone: ["foundational", "building", "casual"],
    effectiveness: "medium",
    context: "Emphasizes building strong foundation",
    example: "Before you advance in coding, master these fundamentals",
  },
  {
    id: "edu_science_behind",
    pattern: "The science behind why {topic} works",
    category: "educational",
    tone: ["scientific", "explanatory", "casual"],
    effectiveness: "medium",
    context: "Scientific explanation approach",
    example: "The science behind why meditation works",
  },

  // Viral/Engaging Hooks
  {
    id: "viral_unbelievable_result",
    pattern: "You won't believe what happened when I tried {topic}",
    category: "viral",
    tone: ["surprising", "dramatic", "casual"],
    effectiveness: "high",
    context: "Creates shock and anticipation",
    example: "You won't believe what happened when I tried cold showers for 30 days",
  },
  {
    id: "viral_life_changer",
    pattern: "This {topic} hack changed everything for me",
    category: "viral",
    tone: ["inspiring", "dramatic", "casual"],
    effectiveness: "high",
    context: "Personal transformation story",
    example: "This productivity hack changed everything for me",
  },
  {
    id: "viral_insider_secret",
    pattern: "Industry insiders don't want you to know this about {topic}",
    category: "viral",
    tone: ["exclusive", "intriguing", "casual"],
    effectiveness: "high",
    context: "Creates insider knowledge appeal",
    example: "Industry insiders don't want you to know this about social media algorithms",
  },
  {
    id: "viral_trending_missing",
    pattern: "Everyone's talking about {topic}, but here's what they're missing",
    category: "viral",
    tone: ["trendy", "urgent", "casual"],
    effectiveness: "high",
    context: "Taps into trends with unique angle",
    example: "Everyone's talking about AI, but here's what they're missing",
  },
  {
    id: "viral_wrong_way",
    pattern: "Stop doing {topic} wrong - here's the right way",
    category: "viral",
    tone: ["dramatic", "urgent", "casual"],
    effectiveness: "medium",
    context: "Dramatic correction angle",
    example: "Stop doing content creation wrong - here's the right way",
  },
  {
    id: "viral_mind_blown",
    pattern: "This {topic} discovery will blow your mind",
    category: "viral",
    tone: ["amazing", "surprising", "casual"],
    effectiveness: "medium",
    context: "Creates amazement and curiosity",
    example: "This psychology discovery will blow your mind",
  },
  {
    id: "viral_game_changer",
    pattern: "I found the {topic} method that changes everything",
    category: "viral",
    tone: ["revolutionary", "exciting", "casual"],
    effectiveness: "high",
    context: "Promises revolutionary improvement",
    example: "I found the learning method that changes everything",
  },
  {
    id: "viral_accident_discovery",
    pattern: "I discovered this {topic} secret by accident",
    category: "viral",
    tone: ["surprising", "lucky", "casual"],
    effectiveness: "medium",
    context: "Accidental discovery narrative",
    example: "I discovered this networking secret by accident",
  },

  // Alex Hormozi-inspired hooks (proven high engagement)
  {
    id: "viral_learned_from_unexpected",
    pattern: "I learned this {topic} strategy from {unexpected source} that makes {outcome} way more effective",
    category: "viral",
    tone: ["credible", "intriguing", "casual"],
    effectiveness: "high",
    context: "Credibility through unexpected sources",
    example: "I learned this negotiation strategy from a street vendor that makes closing deals way more effective",
  },
  {
    id: "speed_numbers_hack",
    pattern: "{number} hacks to {improvement area}",
    category: "speed",
    tone: ["direct", "practical", "casual"],
    effectiveness: "high",
    context: "Numbered list promise for quick value",
    example: "3 hacks to double your productivity",
  },
  {
    id: "speed_if_i_said",
    pattern: "If I said {statement about topic}, you'd think I'm crazy, but...",
    category: "speed",
    tone: ["contrarian", "bold", "casual"],
    effectiveness: "high",
    context: "Contrarian opener that challenges assumptions",
    example: "If I said you should work less to earn more, you'd think I'm crazy, but...",
  },
  {
    id: "viral_significant_life_event",
    pattern: "I just {experienced significant event} for {unexpected reason}",
    category: "viral",
    tone: ["personal", "dramatic", "casual"],
    effectiveness: "high",
    context: "Personal story with surprising twist",
    example: "I just quit my dream job for the most unexpected reason",
  },
  {
    id: "edu_fastest_way_learn",
    pattern: "The fastest way to learn {topic} is to {specific action}",
    category: "educational",
    tone: ["efficient", "practical", "casual"],
    effectiveness: "high",
    context: "Efficiency-focused learning approach",
    example: "The fastest way to learn public speaking is to record yourself daily",
  },
  {
    id: "speed_two_things_say",
    pattern: "Two things you can say to get around {common problem}",
    category: "speed",
    tone: ["practical", "solution-oriented", "casual"],
    effectiveness: "high",
    context: "Specific tactical solutions",
    example: "Two things you can say to get around price objections",
  },
  {
    id: "viral_greatest_advantage",
    pattern: "When you start {activity}, you have one of the greatest advantages: {unique asset}",
    category: "viral",
    tone: ["encouraging", "strategic", "casual"],
    effectiveness: "high",
    context: "Reframes beginnings as advantages",
    example: "When you start content creation, you have one of the greatest advantages: nobody knows you yet",
  },
  {
    id: "speed_cant_do_both",
    pattern: "You can't {desired outcome} and also {competing desire} at the same time",
    category: "speed",
    tone: ["direct", "reality-check", "casual"],
    effectiveness: "high",
    context: "Highlights contradictory desires",
    example: "You can't build wealth and also avoid all financial risk at the same time",
  },
  {
    id: "edu_how_do_i_achieve",
    pattern: "How do I {achieve desired outcome}? Most people could do it in {timeframe}",
    category: "educational",
    tone: ["direct", "actionable", "casual"],
    effectiveness: "high",
    context: "Question-answer format with timeline",
    example: "How do I get fit? Most people could do it in 90 days",
  },
  {
    id: "viral_most_adjective_noun",
    pattern: "What is the most {adjective} {noun} you've ever {action}?",
    category: "viral",
    tone: ["engaging", "personal", "casual"],
    effectiveness: "high",
    context: "Engaging question that invites personal reflection",
    example: "What is the most courageous decision you've ever made?",
  },
  {
    id: "speed_outperform_percentage",
    pattern: "You can outperform {percentage}% of {target audience} without {skill} by {simple action}",
    category: "speed",
    tone: ["encouraging", "strategic", "casual"],
    effectiveness: "high",
    context: "Achievable advantage through simple actions",
    example: "You can outperform 90% of content creators without talent by just being consistent",
  },
  {
    id: "edu_lesson_wish_known",
    pattern: "A {life stage} lesson I wish I'd known earlier: {insight}",
    category: "educational",
    tone: ["reflective", "wisdom", "casual"],
    effectiveness: "high",
    context: "Wisdom sharing from experience",
    example: "A business lesson I wish I'd known earlier: anything worthwhile takes 3x longer than expected",
  },
  {
    id: "viral_never_achieved_until",
    pattern: "I had never achieved {result} until I {catalyst}",
    category: "viral",
    tone: ["transformational", "personal", "casual"],
    effectiveness: "high",
    context: "Transformation story with turning point",
    example: "I had never made six figures until I stopped trying to please everyone",
  },
  {
    id: "speed_one_trait_pick",
    pattern: "If I had to pick one {trait} for {target audience}, it would be {specific trait}",
    category: "speed",
    tone: ["decisive", "valuable", "casual"],
    effectiveness: "high",
    context: "Simplified advice focusing on one key trait",
    example: "If I had to pick one skill for entrepreneurs, it would be resilience",
  },
];

/**
 * Get hook examples filtered by criteria
 */
export function getHookExamples(options: {
  category?: "speed" | "educational" | "viral";
  tone?: string;
  effectiveness?: "high" | "medium" | "low";
  limit?: number;
}): HookExample[] {
  let filtered = HOOK_EXAMPLES;

  if (options.category) {
    filtered = filtered.filter((hook) => hook.category === options.category);
  }

  if (options.tone) {
    filtered = filtered.filter((hook) => hook.tone.includes(options.tone!));
  }

  if (options.effectiveness) {
    filtered = filtered.filter((hook) => hook.effectiveness === options.effectiveness);
  }

  // Sort by effectiveness (high first)
  filtered.sort((a, b) => {
    const effectivenessOrder = { high: 3, medium: 2, low: 1 };
    return effectivenessOrder[b.effectiveness] - effectivenessOrder[a.effectiveness];
  });

  // Randomize order within same effectiveness level to provide variety
  const shuffled: HookExample[] = [];
  let currentEffectiveness = "";
  let currentGroup: HookExample[] = [];

  filtered.forEach((hook, index) => {
    if (hook.effectiveness !== currentEffectiveness) {
      // Shuffle and add previous group
      if (currentGroup.length > 0) {
        currentGroup.sort(() => Math.random() - 0.5);
        shuffled.push(...currentGroup);
      }
      currentEffectiveness = hook.effectiveness;
      currentGroup = [hook];
    } else {
      currentGroup.push(hook);
    }

    // Handle last group
    if (index === filtered.length - 1) {
      currentGroup.sort(() => Math.random() - 0.5);
      shuffled.push(...currentGroup);
    }
  });

  if (options.limit) {
    return shuffled.slice(0, options.limit);
  }

  return shuffled;
}

/**
 * Get hook examples formatted for AI prompt
 */
export function formatHookExamplesForPrompt(options: {
  category?: "speed" | "educational" | "viral";
  tone?: string;
  limit?: number;
}): string {
  const examples = getHookExamples({ ...options, effectiveness: "high" });

  if (examples.length === 0) {
    return "";
  }

  const categoryName = options.category
    ? options.category.charAt(0).toUpperCase() + options.category.slice(1)
    : "Various";

  let formatted = `${categoryName} Hook Examples:\n`;

  examples.forEach((example) => {
    // Show both the pattern template and a concrete example
    formatted += `Pattern: "${example.pattern}"\n`;
    formatted += `Example: "${example.example}"\n`;
    formatted += `Context: ${example.context}\n\n`;
  });

  return formatted;
}
