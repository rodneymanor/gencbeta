// Extended contextual actions system for different content types

export interface BaseElement {
  id: string;
  type: string;
  text: string;
  confidence?: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface ContextualAction {
  id: string;
  type: string;
  label: string;
  icon: string;
  description: string;
  hasDropdown?: boolean;
  dropdownOptions?: DropdownOption[];
}

export interface DropdownOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

// Script-specific element types
export interface ScriptElement extends BaseElement {
  type: "hook" | "bridge" | "golden-nugget" | "wta";
  confidence: number;
}

// Note-specific element types
export interface NoteElement extends BaseElement {
  type: "heading" | "paragraph" | "list" | "quote" | "code" | "key-point";
}

// Generic content element
export type ContentElement = ScriptElement | NoteElement | BaseElement;

// Action providers for different content types
export interface ActionProvider {
  getActions(element: ContentElement): ContextualAction[];
}

// Universal actions that apply to all content types
export const universalActions: ContextualAction[] = [
  {
    id: "edit",
    type: "edit",
    label: "Edit",
    icon: "✏️",
    description: "Make custom edits to this text",
  },
  {
    id: "humanize",
    type: "humanize",
    label: "Humanize",
    icon: "🤖",
    description: "Make this text sound more natural and human",
  },
  {
    id: "improve",
    type: "improve",
    label: "Improve",
    icon: "✨",
    description: "Enhance clarity and impact",
  },
  {
    id: "simplify",
    type: "simplify",
    label: "Simplify",
    icon: "📐",
    description: "Make this easier to understand",
  },
];

// Script-specific actions
export const scriptActions: Record<string, ContextualAction[]> = {
  hook: [
    {
      id: "rewrite_hook",
      type: "rewrite_hook",
      label: "Rewrite Hook",
      icon: "🔄",
      description: "Rewrite using different hook types",
      hasDropdown: true,
      dropdownOptions: [
        { id: "question", label: "Question Hook", description: "Transform into an engaging question", icon: "❓" },
        { id: "statistic", label: "Statistic Hook", description: "Lead with a compelling statistic", icon: "📊" },
        { id: "story", label: "Story Hook", description: "Start with a personal story", icon: "📖" },
        { id: "contrarian", label: "Contrarian Hook", description: "Challenge common beliefs", icon: "🤔" },
        { id: "cliffhanger", label: "Cliffhanger Hook", description: "Create suspense and curiosity", icon: "🎭" },
        { id: "direct", label: "Direct Hook", description: "Get straight to the point", icon: "➡️" },
        { id: "metaphor", label: "Metaphor Hook", description: "Use a powerful comparison", icon: "🔗" },
        { id: "emotional", label: "Emotional Hook", description: "Appeal to emotions", icon: "❤️" },
      ],
    },
    {
      id: "make_intriguing",
      type: "enhance",
      label: "Make More Intriguing",
      icon: "🎯",
      description: "Increase curiosity and engagement",
    },
  ],
  bridge: [
    {
      id: "smooth_transition",
      type: "enhance",
      label: "Smooth Transition",
      icon: "🌉",
      description: "Make the connection clearer",
    },
    {
      id: "add_context",
      type: "expand",
      label: "Add Context",
      icon: "📝",
      description: "Provide more background",
    },
  ],
  "golden-nugget": [
    {
      id: "add_data",
      type: "enhance",
      label: "Add Supporting Data",
      icon: "📊",
      description: "Include statistics or research",
    },
    {
      id: "make_actionable",
      type: "transform",
      label: "Make Actionable",
      icon: "🎯",
      description: "Turn into practical advice",
    },
  ],
  wta: [
    {
      id: "add_urgency",
      type: "enhance",
      label: "Add Urgency",
      icon: "⏰",
      description: "Create time sensitivity",
    },
    {
      id: "clarify_benefit",
      type: "enhance",
      label: "Clarify Benefit",
      icon: "🎁",
      description: "Highlight what they'll gain",
    },
  ],
};

// Note-specific actions
export const noteActions: Record<string, ContextualAction[]> = {
  heading: [
    {
      id: "make_compelling",
      type: "enhance",
      label: "Make Compelling",
      icon: "💡",
      description: "Create a more engaging title",
    },
    {
      id: "add_subheading",
      type: "expand",
      label: "Add Subheading",
      icon: "➕",
      description: "Include a descriptive subtitle",
    },
  ],
  paragraph: [
    {
      id: "summarize",
      type: "transform",
      label: "Summarize",
      icon: "📄",
      description: "Create a concise summary",
    },
    {
      id: "expand",
      type: "expand",
      label: "Expand",
      icon: "📝",
      description: "Add more detail and context",
    },
    {
      id: "bulletize",
      type: "transform",
      label: "Convert to Bullets",
      icon: "📋",
      description: "Transform into bullet points",
    },
  ],
  list: [
    {
      id: "prioritize",
      type: "transform",
      label: "Prioritize Items",
      icon: "🔢",
      description: "Reorder by importance",
    },
    {
      id: "expand_items",
      type: "expand",
      label: "Expand Items",
      icon: "➕",
      description: "Add details to each point",
    },
  ],
  quote: [
    {
      id: "add_attribution",
      type: "enhance",
      label: "Add Attribution",
      icon: "👤",
      description: "Include source information",
    },
    {
      id: "contextualize",
      type: "expand",
      label: "Add Context",
      icon: "💬",
      description: "Explain the significance",
    },
  ],
  "key-point": [
    {
      id: "elaborate",
      type: "expand",
      label: "Elaborate",
      icon: "🔍",
      description: "Provide more explanation",
    },
    {
      id: "add_example",
      type: "expand",
      label: "Add Example",
      icon: "💡",
      description: "Include a practical example",
    },
  ],
};

// Script Action Provider
export class ScriptActionProvider implements ActionProvider {
  getActions(element: ContentElement): ContextualAction[] {
    const actions = [...universalActions];

    if (element.type in scriptActions) {
      actions.push(...scriptActions[element.type]);
    }

    return actions;
  }
}

// Note Action Provider
export class NoteActionProvider implements ActionProvider {
  getActions(element: ContentElement): ContextualAction[] {
    const actions = [...universalActions];

    if (element.type in noteActions) {
      actions.push(...noteActions[element.type]);
    }

    return actions;
  }
}

// Generic Action Provider (for custom content types)
export class GenericActionProvider implements ActionProvider {
  constructor(private customActions: Record<string, ContextualAction[]> = {}) {}

  getActions(element: ContentElement): ContextualAction[] {
    const actions = [...universalActions];

    if (element.type in this.customActions) {
      actions.push(...this.customActions[element.type]);
    }

    return actions;
  }
}

// Factory function to get appropriate action provider
export function getActionProvider(
  contentType: "script" | "note" | "custom",
  customActions?: Record<string, ContextualAction[]>,
): ActionProvider {
  switch (contentType) {
    case "script":
      return new ScriptActionProvider();
    case "note":
      return new NoteActionProvider();
    case "custom":
      return new GenericActionProvider(customActions);
    default:
      return new GenericActionProvider();
  }
}

// Helper to detect element type from text content (for notes)
export function detectNoteElementType(text: string, tagName?: string): NoteElement["type"] {
  if (tagName) {
    switch (tagName.toLowerCase()) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return "heading";
      case "ul":
      case "ol":
      case "li":
        return "list";
      case "blockquote":
        return "quote";
      case "code":
      case "pre":
        return "code";
    }
  }

  // Detect based on content patterns
  if (text.startsWith("#") || text.match(/^[A-Z][^.!?]*$/)) {
    return "heading";
  }

  if (text.startsWith("-") || text.startsWith("*") || text.match(/^\d+\./)) {
    return "list";
  }

  if (text.startsWith(">")) {
    return "quote";
  }

  // Check for key point indicators
  if (
    text.toLowerCase().includes("key point") ||
    text.toLowerCase().includes("important:") ||
    text.startsWith("**") ||
    text.match(/^(Note|Tip|Warning|Important):/i)
  ) {
    return "key-point";
  }

  return "paragraph";
}
