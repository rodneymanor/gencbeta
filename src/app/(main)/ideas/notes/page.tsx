"use client";

import { useState } from "react";

import { Plus, Hash, X, Save, Mic } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { NoteEditor } from "./_components/note-editor";
import { mockNotes, availableTags, type Note } from "./_components/notes-data";
import { NotesList } from "./_components/notes-list";
import { SearchFilters } from "./_components/search-filters";
import { VoiceRecorder } from "./_components/voice-recorder";

export default function NotesCapturePage() {
  const [notes, setNotes] = useState(mockNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("updated");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

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
      type: "text" as const,
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteTags([]);
    setIsEditing(true);
  };

  const createVoiceNote = (audioBlob: Blob, duration: number, transcript?: string) => {
    // Convert blob to URL for playback
    const audioUrl = URL.createObjectURL(audioBlob);

    // Generate a default title
    const title = `Voice Note - ${new Date().toLocaleString()}`;

    const newNote = {
      id: Date.now(),
      title,
      content: transcript ?? "Voice recording - no transcript available",
      tags: ["voice"],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      starred: false,
      type: "voice" as const,
      audioUrl,
      duration,
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setShowVoiceRecorder(false);
    setIsEditing(false);
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

  const convertToScript = (note: Note) => {
    // This would navigate to the script creation flow with pre-filled content
    console.log("Converting note to script:", note.title);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes Capture</h1>
          <p className="text-muted-foreground">Organize your ideas with rich text editing and smart tagging</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowVoiceRecorder(true)}>
            <Mic className="h-4 w-4" />
            Voice Note
          </Button>
          <Button className="gap-2" onClick={() => setSelectedNote(null)}>
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="text-lg font-semibold"
                />

                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="min-h-[300px]"
                  placeholder="Start writing your note... You can use Markdown formatting."
                />

                {/* Tag Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm font-medium">Tags:</span>
                  </div>

                  <div className="flex gap-2">
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
                    <Button variant="outline" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>
                      Add
                    </Button>
                  </div>

                  {newNoteTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newNoteTags.map((tag) => (
                        <Badge key={tag} className={`text-xs ${getTagColor(tag)} text-white`}>
                          {tag}
                          <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={createNewNote} disabled={!newNoteTitle.trim()} className="gap-2">
                  <Save className="h-4 w-4" />
                  Create Note
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg">
            <VoiceRecorder onSave={createVoiceNote} onCancel={() => setShowVoiceRecorder(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
