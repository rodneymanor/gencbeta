import { StickyNote, FileText } from "lucide-react";

import type { SearchResult } from "./search-service";

/**
 * Mock notes data - replace with actual API when notes are implemented
 */
export const getMockNotesData = (): SearchResult[] => [
  {
    id: "note-1",
    title: "Content Ideas for Q1",
    description: "Brainstorming session notes for upcoming content calendar",
    type: "note",
    url: "/ideas/notes/note-1",
    icon: StickyNote,
    metadata: { createdAt: "2024-01-15", category: "Ideas" },
  },
  {
    id: "note-2",
    title: "Trend Analysis",
    description: "Notes on current social media trends and opportunities",
    type: "note",
    url: "/ideas/notes/note-2",
    icon: StickyNote,
    metadata: { createdAt: "2024-01-20", category: "Research" },
  },
];

/**
 * Mock scripts data - replace with actual API when scripts are implemented
 */
export const getMockScriptsData = (): SearchResult[] => [
  {
    id: "script-1",
    title: "Productivity Tips Video",
    description: "Script for productivity tips video series",
    type: "script",
    url: "/dashboard/scripts/editor/script-1",
    icon: FileText,
    metadata: { createdAt: "2024-01-10", category: "Scripts" },
  },
  {
    id: "script-2",
    title: "Brand Story Introduction",
    description: "Introduction script for brand story content",
    type: "script",
    url: "/dashboard/scripts/editor/script-2",
    icon: FileText,
    metadata: { createdAt: "2024-01-18", category: "Scripts" },
  },
];
