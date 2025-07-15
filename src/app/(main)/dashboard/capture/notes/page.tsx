"use client";

import { useState } from "react";

import { Plus, Hash, X, Save } from "lucide-react";

import { Input } from "@/components/ui/input";
import { HemingwayEditor } from "../../scripts/editor/_components/hemingway-editor";
import { NoteEditor } from "./_components/note-editor";
import { NotesList } from "./_components/notes-list";
import { SearchFilters } from "./_components/search-filters";

// Mock notes data
const mockNotes = [
  {
    id: 1,
    title: "Morning Routine Ideas",
    content: `# Morning Routine Strategy

Key insights for content:
- Most people focus on what they do, not when they do it
- First 10 minutes are crucial for setting intention
- **Three-step framework:**
  1. Hydrate before caffeinate
  2. Set one clear intention
  3. Move your body (even 2 minutes)

> This could work as a TikTok series - one video per step

**Potential hooks:**
- "What if I told you 90% of people do morning routines wrong?"
- "The first 10 minutes of your day determine everything"`,
    tags: ["morning", "routine", "productivity", "tiktok"],
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
    starred: true,
  },
  {
    id: 2,
    title: "Content Ideas - Tech Reviews",
    content: `## Tech Review Framework

**Structure:**
1. Hook with personal story
2. Show the product in action
3. Honest pros and cons
4. Who it's perfect for
5. Call to action

**Upcoming reviews:**
- New iPhone features for creators
- Budget microphone comparison
- Editing apps for beginners

*Note: Focus on creator-specific use cases*`,
    tags: ["tech", "reviews", "content", "structure"],
    createdAt: "2024-01-18",
    updatedAt: "2024-01-19",
    starred: false,
  },
  {
    id: 3,
    title: "Storytelling Techniques",
    content: `Personal storytelling for social media:

**The 3-Act Structure:**
- Setup: Where I was
- Conflict: What went wrong
- Resolution: How I changed

**Emotional hooks:**
- Start with the end result
- Use specific details
- Include vulnerable moments
- End with actionable advice

Remember: People connect with struggle, not success.`,
    tags: ["storytelling", "social media", "engagement"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-16",
    starred: true,
  },
];

const availableTags = [
  { name: "morning", color: "bg-blue-500" },
  { name: "routine", color: "bg-green-500" },
  { name: "productivity", color: "bg-purple-500" },
  { name: "tiktok", color: "bg-pink-500" },
  { name: "tech", color: "bg-[#2d93ad]" },
  { name: "reviews", color: "bg-[#412722]" },
  { name: "content", color: "bg-indigo-500" },
  { name: "structure", color: "bg-emerald-500" },
  { name: "storytelling", color: "bg-red-500" },
  { name: "social media", color: "bg-yellow-500" },
  { name: "engagement", color: "bg-violet-500" },
];

export default function NotesCapturePage() {
  const [notes, setNotes] = useState(mockNotes);
  const [selectedNote, setSelectedNote] = useState<(typeof mockNotes)[0] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("updated");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => note.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sortBy) {
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      case "starred":
        return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const createNewNote = () => {
    if (!newNoteTitle.trim()) return;

    const newNote = {
      id: Date.now(),
      title: newNoteTitle,
      content: newNoteContent,
      tags: newNoteTags,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      starred: false,
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteTags([]);
    setIsEditing(true);
  };

  const saveNote = () => {
    if (!selectedNote) return;

    setNotes((prev) =>
      prev.map((note) =>
        note.id === selectedNote.id ? { ...selectedNote, updatedAt: new Date().toISOString().split("T")[0] } : note,
      ),
    );
    setIsEditing(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addTag = (tag: string) => {
    if (!tag.trim() || newNoteTags.includes(tag)) return;
    setNewNoteTags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setNewNoteTags((prev) => prev.filter((t) => t !== tag));
  };

  const getTagColor = (tagName: string) => {
    const tag = availableTags.find((t) => t.name === tagName);
    return tag?.color ?? "bg-gray-500";
  };

  const convertToScript = (note: (typeof mockNotes)[0]) => {
    // This would navigate to the script creation flow with pre-filled content
    console.log("Converting note to script:", note.title);
  };

  return (
    <div className="mx-auto max-w-7xl" style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px'}}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between" style={{gap: '16px'}}>
        <div>
          <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Notes Capture</h1>
          <p className="text-base font-normal text-gray-600 dark:text-gray-400">Organize your ideas with rich text editing and smart tagging</p>
        </div>
        <button 
          onClick={() => setSelectedNote(null)}
          className="h-10 px-6 rounded-[20px] bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 ease-in-out flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{gap: '32px'}}>
        {/* Notes List */}
        <div className="space-y-4 lg:col-span-1">
          {/* Search and Filters */}
          <SearchFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
            clearFilters={() => setSelectedTags([])}
            sortBy={sortBy}
            setSortBy={setSortBy}
            availableTags={availableTags}
          />

          {/* Notes List */}
          <NotesList
            notes={sortedNotes}
            selectedNote={selectedNote}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setIsEditing(false);
            }}
            getTagColor={getTagColor}
          />
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          <NoteEditor
            selectedNote={selectedNote}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setSelectedNote={setSelectedNote}
            saveNote={saveNote}
            convertToScript={convertToScript}
            getTagColor={getTagColor}
          />

          {!selectedNote && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl" style={{padding: '24px'}}>
              <div className="flex items-center gap-2" style={{marginBottom: '24px'}}>
                <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Create New Note</h2>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                <Input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="text-lg font-semibold"
                />

                <div className="min-h-[300px]">
                  <HemingwayEditor
                    value={newNoteContent}
                    onChange={setNewNoteContent}
                    placeholder="Start writing your note... Use the rich editor with readability analysis."
                    minRows={8}
                    maxRows={20}
                  />
                </div>

                {/* Tag Input */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Tags:</span>
                  </div>

                  <div className="flex" style={{gap: '8px'}}>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                    />
                    <button 
                      onClick={() => addTag(tagInput)} 
                      disabled={!tagInput.trim()}
                      className="h-10 px-6 rounded-[20px] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-normal hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>

                  {newNoteTags.length > 0 && (
                    <div className="flex flex-wrap" style={{gap: '8px'}}>
                      {newNoteTags.map((tag) => (
                        <div key={tag} className={`text-xs ${getTagColor(tag)} text-white rounded-lg flex items-center gap-1`} style={{padding: '4px 8px'}}>
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={createNewNote} 
                  disabled={!newNoteTitle.trim()}
                  className="h-10 px-6 rounded-[20px] bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 ease-in-out flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  Create Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
