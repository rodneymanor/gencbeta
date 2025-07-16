/**
 * WTA (What To Action) Templates Data
 * Comprehensive collection of call-to-action templates for social media content
 */

export interface WTATemplate {
  id: string;
  text: string;
  category: string;
  subcategory?: string;
}

export interface WTACategory {
  id: string;
  name: string;
  description: string;
  templates: WTATemplate[];
  subcategories?: WTASubcategory[];
}

export interface WTASubcategory {
  id: string;
  name: string;
  description: string;
  templates: WTATemplate[];
}

export const wtaTemplatesData: WTACategory[] = [
  {
    id: "follow",
    name: "Follow CTAs",
    description: "Templates to encourage following your account",
    templates: [
      {
        id: "follow-1",
        text: "If you want [SPECIFIC DESIRED OUTCOME] hit the follow",
        category: "follow",
      },
      {
        id: "follow-2",
        text: "If you are not sure how you ever going to [SPECIFIC DESIRED OUTCOME] hit the follow",
        category: "follow",
      },
      {
        id: "follow-3",
        text: "For daily [MAIN TOPIC] tips hit the follow",
        category: "follow",
      },
      {
        id: "follow-4",
        text: "It's a mission of mine to help you [DESIRED OUTCOME]. So hit that follow.",
        category: "follow",
      },
      {
        id: "follow-5",
        text: "You can learn a lot about [YOUR MAIN TOPIC] if you hit follow",
        category: "follow",
      },
      {
        id: "follow-6",
        text: "This week I have 3 more videos coming on this topic, if you don't want to miss them hit the follow",
        category: "follow",
      },
      {
        id: "follow-7",
        text: "You can stay ahead of ______ by following me.",
        category: "follow",
      },
      {
        id: "follow-8",
        text: "You can learn a lot about [MAIN TOPIC] by following me / my account",
        category: "follow",
      },
      {
        id: "follow-9",
        text: "I'll keep you updated with current best practices in [MAIN TOPIC] so hit the follow",
        category: "follow",
      },
      {
        id: "follow-10",
        text: "I'm gonna have to do a part 2 and part 3 so if you don't want to miss out hit the follow",
        category: "follow",
      },
      {
        id: "follow-11",
        text: "So if you want to improve your _______ I share practical tips every single day, so hit that follow.",
        category: "follow",
      },
      {
        id: "follow-12",
        text: "so if you want ______ and still hit your goals, hit follow.",
        category: "follow",
      },
    ],
  },
  {
    id: "share",
    name: "Share CTAs",
    description: "Templates to encourage sharing your content",
    templates: [
      {
        id: "share-1",
        text: "Think of a friend who should know about this and tag them below",
        category: "share",
      },
      {
        id: "share-2",
        text: "Think of a friend who would benefit from this tip and go SHARE it.",
        category: "share",
      },
      {
        id: "share-3",
        text: "Think of a friend who might be struggling with this and send them this video",
        category: "share",
      },
      {
        id: "share-4",
        text: "Think of someone who would find this tip helpful and tag them in the comments",
        category: "share",
      },
      {
        id: "share-5",
        text: "My goal is to help as many people as I can who struggle with _________ , so it would mean the world to me if you shared this video with a friend.",
        category: "share",
      },
    ],
  },
  {
    id: "save",
    name: "Save CTAs",
    description: "Templates to encourage saving/bookmarking your content",
    templates: [
      {
        id: "save-1",
        text: "If you don't want to forget these tips you may want to add a bookmark",
        category: "save",
      },
      {
        id: "save-2",
        text: "If this was useful add this video to your favorites.",
        category: "save",
      },
      {
        id: "save-3",
        text: "If you are like me who forgets stuff then bookmark this video for later.",
        category: "save",
      },
      {
        id: "save-4",
        text: "Now I don't know about you but I easily forget stuff, so if you are like me then save this video for later",
        category: "save",
      },
      {
        id: "save-5",
        text: "Save this video so you don't forget it!",
        category: "save",
      },
    ],
  },
  {
    id: "save-mid",
    name: "Mid-Video Save CTAs",
    description: "Templates for mid-video save encouragement",
    templates: [
      {
        id: "save-mid-1",
        text: "You may want to save this for later",
        category: "save-mid",
      },
      {
        id: "save-mid-2",
        text: "You may want to Bookmark this video so you can come back to it.",
        category: "save-mid",
      },
      {
        id: "save-mid-3",
        text: "Now you may want to watch this video again so add a bookmark",
        category: "save-mid",
      },
      {
        id: "save-mid-4",
        text: "(display useful info on the screen) Take a screenshot, or can just bookmark this video",
        category: "save-mid",
      },
    ],
  },
  {
    id: "comment",
    name: "Comment CTAs",
    description: "Templates to encourage commenting and engagement",
    templates: [
      {
        id: "comment-1",
        text: "Do you agree 👍 or disagree 👎 let me know below",
        category: "comment",
      },
      {
        id: "comment-2",
        text: "Which one do you prefer A or B let me know below",
        category: "comment",
      },
      {
        id: "comment-3",
        text: "If you want to [SOLVE COMMON PROBLEM] drop a [CHOOSE AN EMOJI YOU LIKE] in the comments",
        category: "comment",
      },
      {
        id: "comment-4",
        text: "On a 0-10 scale! How helpful was this video? Let me know in the comments!",
        category: "comment",
      },
      {
        id: "comment-5",
        text: "and if you want to know how to [ACHIEVE SPECIFIC DESIRED OUTCOME], comment: [WORD]",
        category: "comment",
      },
      {
        id: "comment-6",
        text: "… let me know what you think!",
        category: "comment",
      },
      {
        id: "comment-7",
        text: "But I'd love to hear your thoughts: [Question]",
        category: "comment",
      },
      {
        id: "comment-8",
        text: "So the question is: Should _____ or not?",
        category: "comment",
      },
      {
        id: "comment-9",
        text: "Let me know if I'm missing something.",
        category: "comment",
      },
      {
        id: "comment-10",
        text: "And I would love to hear from you: Is this _____ that you would _____?",
        category: "comment",
      },
      {
        id: "comment-11",
        text: "I'd love to hear your thoughts in the comments.",
        category: "comment",
      },
      {
        id: "comment-12",
        text: "Tell me if I'm wrong in the comments",
        category: "comment",
      },
      {
        id: "comment-13",
        text: "If you disagree change my mind in the comments",
        category: "comment",
      },
    ],
  },
  {
    id: "comment-word",
    name: "Comment The Word CTAs",
    description: "Templates for specific word/action commenting",
    templates: [
      {
        id: "comment-word-1",
        text: 'If you want [DESIRED OUTCOME], comment the word "[WORD]" and I sent it over.',
        category: "comment-word",
      },
      {
        id: "comment-word-2",
        text: 'I\'ve put together a document showing you this step by step. If you want it, comment "_____"',
        category: "comment-word",
      },
    ],
  },
  {
    id: "questions",
    name: "Engagement Questions",
    description: "Strategic questions to boost comments and engagement",
    subcategories: [
      {
        id: "identity-driven",
        name: "Identity-Driven Questions",
        description: "Questions that help users define their identity",
        templates: [
          {
            id: "identity-1",
            text: "Do you see yourself as someone who values connection or perfection?",
            category: "questions",
            subcategory: "identity-driven",
          },
          {
            id: "identity-2",
            text: "Are you the kind of person who prioritizes engagement or creativity when posting?",
            category: "questions",
            subcategory: "identity-driven",
          },
          {
            id: "identity-3",
            text: "Do you create content to express yourself or to grow an audience?",
            category: "questions",
            subcategory: "identity-driven",
          },
          {
            id: "identity-4",
            text: "Would you describe yourself as a consistent creator or someone who posts when inspired?",
            category: "questions",
            subcategory: "identity-driven",
          },
          {
            id: "identity-5",
            text: "Is making videos something you do for fun or for results?",
            category: "questions",
            subcategory: "identity-driven",
          },
        ],
      },
      {
        id: "validation-seeking",
        name: "Validation-Seeking Questions",
        description: "Questions that validate common struggles",
        templates: [
          {
            id: "validation-1",
            text: "Have you ever felt stuck after posting a lot but not seeing any growth?",
            category: "questions",
            subcategory: "validation-seeking",
          },
          {
            id: "validation-2",
            text: "Have you noticed that posting consistently doesn't always mean more engagement?",
            category: "questions",
            subcategory: "validation-seeking",
          },
          {
            id: "validation-3",
            text: "Did you ever think about quitting after putting in so much effort with no response?",
            category: "questions",
            subcategory: "validation-seeking",
          },
          {
            id: "validation-4",
            text: "Have you ever posted a video you thought was great, only to get no views?",
            category: "questions",
            subcategory: "validation-seeking",
          },
          {
            id: "validation-5",
            text: "Have you tried using personal stories in your content, and how did it go?",
            category: "questions",
            subcategory: "validation-seeking",
          },
        ],
      },
      {
        id: "contrarian",
        name: "Contrarian/Polarizing Questions",
        description: "Questions that challenge common beliefs",
        templates: [
          {
            id: "contrarian-1",
            text: "Is perfect editing really necessary to grow on TikTok?",
            category: "questions",
            subcategory: "contrarian",
          },
          {
            id: "contrarian-2",
            text: "Do you think creators should stop worrying about going viral and focus on real connection?",
            category: "questions",
            subcategory: "contrarian",
          },
          {
            id: "contrarian-3",
            text: "Is using trending sounds overrated for engagement?",
            category: "questions",
            subcategory: "contrarian",
          },
          {
            id: "contrarian-4",
            text: "Do you believe that a relatable creator is better than a polished one?",
            category: "questions",
            subcategory: "contrarian",
          },
          {
            id: "contrarian-5",
            text: "Is it better to post daily content or only when you have something valuable to share?",
            category: "questions",
            subcategory: "contrarian",
          },
        ],
      },
      {
        id: "tough-choice",
        name: "Tough Choice Questions",
        description: "Questions that force difficult decisions",
        templates: [
          {
            id: "tough-choice-1",
            text: "Would you rather post a video that looks amazing but gets no engagement, or a rough one that goes viral?",
            category: "questions",
            subcategory: "tough-choice",
          },
          {
            id: "tough-choice-2",
            text: "Would you focus more on your content looking professional or feeling authentic?",
            category: "questions",
            subcategory: "tough-choice",
          },
          {
            id: "tough-choice-3",
            text: "If you had to pick, would you rather have more views or more comments?",
            category: "questions",
            subcategory: "tough-choice",
          },
          {
            id: "tough-choice-4",
            text: "Would you prefer consistent growth or occasional viral spikes?",
            category: "questions",
            subcategory: "tough-choice",
          },
          {
            id: "tough-choice-5",
            text: "If you could only improve one thing about your videos, what would it be?",
            category: "questions",
            subcategory: "tough-choice",
          },
        ],
      },
      {
        id: "what-would-you-do",
        name: "'What Would You Do?' Questions",
        description: "Hypothetical scenario questions",
        templates: [
          {
            id: "what-would-you-do-1",
            text: "What would you do if your engagement dropped to zero tomorrow?",
            category: "questions",
            subcategory: "what-would-you-do",
          },
          {
            id: "what-would-you-do-2",
            text: "What's the first thing you'd change if your account wasn't growing?",
            category: "questions",
            subcategory: "what-would-you-do",
          },
          {
            id: "what-would-you-do-3",
            text: "How would you approach content differently if views didn't matter?",
            category: "questions",
            subcategory: "what-would-you-do",
          },
          {
            id: "what-would-you-do-4",
            text: "What's your next step if your videos aren't getting comments?",
            category: "questions",
            subcategory: "what-would-you-do",
          },
          {
            id: "what-would-you-do-5",
            text: "If you could redo your last video, what would you change?",
            category: "questions",
            subcategory: "what-would-you-do",
          },
        ],
      },
      {
        id: "future-oriented",
        name: "Future-Oriented Questions",
        description: "Questions about goals and future plans",
        templates: [
          {
            id: "future-oriented-1",
            text: "What's one thing you want to improve about your content this year?",
            category: "questions",
            subcategory: "future-oriented",
          },
          {
            id: "future-oriented-2",
            text: "How do you see your content evolving in the next few months?",
            category: "questions",
            subcategory: "future-oriented",
          },
          {
            id: "future-oriented-3",
            text: "Where do you want your account to be 6 months from now?",
            category: "questions",
            subcategory: "future-oriented",
          },
          {
            id: "future-oriented-4",
            text: "What's one new strategy you want to try to boost engagement?",
            category: "questions",
            subcategory: "future-oriented",
          },
          {
            id: "future-oriented-5",
            text: "If you could achieve one big goal with your content, what would it be?",
            category: "questions",
            subcategory: "future-oriented",
          },
        ],
      },
    ],
    templates: [], // Main templates array is empty since subcategories handle them
  },
];

// Helper function to get all templates from a category (including subcategories)
export function getAllTemplatesFromCategory(category: WTACategory): WTATemplate[] {
  let allTemplates = [...category.templates];

  if (category.subcategories) {
    category.subcategories.forEach((subcategory) => {
      allTemplates = allTemplates.concat(subcategory.templates);
    });
  }

  return allTemplates;
}

// Helper function to search templates
export function searchTemplates(query: string): WTATemplate[] {
  const results: WTATemplate[] = [];

  wtaTemplatesData.forEach((category) => {
    const allTemplates = getAllTemplatesFromCategory(category);
    allTemplates.forEach((template) => {
      if (template.text.toLowerCase().includes(query.toLowerCase())) {
        results.push(template);
      }
    });
  });

  return results;
}
