"use client";

import { useState, useEffect } from "react";

import { Plus } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableLoading } from "@/components/ui/loading-animations";
import { NotesCryptoTable, type NoteCryptoData } from "@/components/ui/notes-crypto-table";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { auth } from "@/lib/firebase";

import { NotesControls } from "./_components/notes-controls";

interface Note extends NoteCryptoData {
  tags: string[];
  source?: string;
  originalApiId?: string; // Store the original string ID from API
}

interface ApiNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: "text" | "voice" | "idea_inbox";
  source?: "manual" | "inbox" | "import";
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ColumnVisibility {
  title: boolean;
  tags: boolean;
  created: boolean;
  updated: boolean;
  starred: boolean;
  content: boolean;
}

// Helper function to convert API note to UI note format
const convertApiNoteToUiNote = (apiNote: ApiNote): Note => {
  // Generate a stable numeric ID from the string ID using a simple hash function
  const generateNumericId = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  return {
    id: generateNumericId(apiNote.id), // Generate stable numeric ID from string
    originalApiId: apiNote.id, // Store original API ID
    title: apiNote.title,
    content: apiNote.content,
    type: mapNoteTypeToDisplayType(apiNote.type, apiNote.tags),
    createdAt: formatDateForDisplay(apiNote.createdAt),
    updatedAt: formatDateForDisplay(apiNote.updatedAt),
    starred: apiNote.starred,
    tags: apiNote.tags,
    source: apiNote.source,
  };
};

// Map note type and tags to display type for UI
const mapNoteTypeToDisplayType = (type: string, tags: string[]): string => {
  if (tags.includes("youtube")) return "youtube";
  if (tags.includes("voice")) return "voice";
  if (tags.includes("webpage")) return "webpage";
  if (tags.includes("chrome-extension")) return "chrome-extension";
  if (tags.includes("instagram")) return "instagram";
  if (tags.includes("tiktok")) return "tiktok";
  return type;
};

// Format date for display
const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  } catch {
    return dateString;
  }
};

// Helper functions
const getSortValue = (note: Note, sortBy: string): string | number => {
  if (sortBy === "title") return note.title;
  if (sortBy === "created") return new Date(note.createdAt).getTime();
  if (sortBy === "updated") return new Date(note.updatedAt).getTime();
  if (sortBy === "starred") return note.starred ? 1 : 0;
  return note.title;
};

const sortNotes = (notes: Note[], sortBy: string, sortOrder: "asc" | "desc"): Note[] => {
  return [...notes].sort((a, b) => {
    const aValue = getSortValue(a, sortBy);
    const bValue = getSortValue(b, sortBy);

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });
};

export default function NotesPage() {
  const [user, loading] = useAuthState(auth);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [columnVisibility] = useState<ColumnVisibility>({
    title: true,
    tags: true,
    created: true,
    updated: true,
    starred: true,
    content: false,
  });

  // Configure top bar
  const { setTopBarConfig } = useTopBarConfig();

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      console.log("📋 [Notes Page] Starting fetchNotes...");
      setIsLoading(true);

      // Get Firebase token for authentication
      if (!user) {
        console.log("❌ [Notes Page] No user found");
        throw new Error("User not authenticated");
      }
      console.log("📋 [Notes Page] Getting ID token...");
      const token = await user.getIdToken();
      console.log("📋 [Notes Page] Making API request to /api/notes");

      const response = await fetch("/api/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📋 [Notes Page] Response received:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ [Notes Page] Error response:", errorText);
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }

      const data = await response.json();
      console.log("📋 [Notes Page] Data received:", data);
      console.log("📋 [Notes Page] First few notes raw data:", data.notes.slice(0, 3));

      const uiNotes = data.notes.map(convertApiNoteToUiNote);

      console.log("📋 [Notes Page] UI Notes after conversion:", uiNotes);
      console.log("📋 [Notes Page] First note mapping:", {
        original: data.notes[0],
        converted: uiNotes[0],
      });

      setNotes(uiNotes);
      setFilteredNotes(uiNotes);
    } catch (error) {
      console.error("❌ [Notes Page] Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      console.log("📋 [Notes Page] Setting loading to false");
      setIsLoading(false);
    }
  };

  const handleCreateNote = () => {
    window.location.href = "/dashboard/capture/notes/new";
  };

  useEffect(() => {
    setTopBarConfig({
      title: "Notes",
      showTitle: true,
      titlePosition: "left",
      actions: (
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateNote} className="gap-2" variant="default" size="sm">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>
      ),
    });
  }, [setTopBarConfig]);

  // Fetch notes when user is authenticated
  useEffect(() => {
    console.log("📋 [Notes Page] Auth state:", { loading, user: !!user, userId: user?.uid });
    if (!loading && user) {
      console.log("📋 [Notes Page] Calling fetchNotes...");
      fetchNotes();
    }
  }, [user, loading]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleSelectNote = (noteId: number) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(filteredNotes.map((note) => note.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotes.size === 0) return;

    setIsLoading(true);
    try {
      // Delete each selected note via API
      // Get Firebase token for authentication
      if (!user) {
        throw new Error("User not authenticated");
      }
      const token = await user.getIdToken();

      const deletePromises = Array.from(selectedNotes).map(async (noteId) => {
        const noteToDelete = notes.find((n) => n.id === noteId);
        if (noteToDelete && noteToDelete.originalApiId) {
          const response = await fetch(`/api/notes/${noteToDelete.originalApiId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to delete note ${noteId}`);
          }
        }
      });

      await Promise.all(deletePromises);

      const updatedNotes = notes.filter((note) => !selectedNotes.has(note.id));
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
      setSelectedNotes(new Set());

      toast.success(`Deleted ${selectedNotes.size} note(s)`);
    } catch (error) {
      console.error("Error deleting notes:", error);
      toast.error("Failed to delete notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStar = async (noteId: number) => {
    try {
      const noteToUpdate = notes.find((n) => n.id === noteId);
      if (!noteToUpdate) return;

      const newStarredStatus = !noteToUpdate.starred;

      // Get Firebase token for authentication
      if (!user) {
        throw new Error("User not authenticated");
      }
      const token = await user.getIdToken();

      // Update via API
      const response = await fetch(`/api/notes/${noteToUpdate.originalApiId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          starred: newStarredStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      // Update local state
      const updatedNotes = notes.map((note) => (note.id === noteId ? { ...note, starred: newStarredStatus } : note));
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);

      toast.success(newStarredStatus ? "Note starred" : "Note unstarred");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleEditNote = (noteId: number) => {
    console.log("📋 [Notes Page] handleEditNote called with noteId:", noteId);
    const noteToEdit = notes.find((n) => n.id === noteId);
    console.log("📋 [Notes Page] Found note:", noteToEdit);

    if (noteToEdit && noteToEdit.originalApiId) {
      const url = `/dashboard/capture/notes/new?noteId=${noteToEdit.originalApiId}`;
      console.log("📋 [Notes Page] Navigating to:", url);
      window.location.href = url;
    } else {
      console.error("📋 [Notes Page] Note not found or missing originalApiId:", { noteId, noteToEdit });
      toast.error("Unable to edit note - ID not found");
    }
  };

  const handleExportSelected = () => {
    if (selectedNotes.size === 0) return;

    const selectedNotesData = notes.filter((note) => selectedNotes.has(note.id));
    const exportData = selectedNotesData.map((note) => ({
      title: note.title,
      content: note.content,
      type: note.type,
      created: note.createdAt,
      updated: note.updatedAt,
      starred: note.starred,
    }));

    const csvContent = [
      ["Title", "Content", "Type", "Created", "Updated", "Starred"],
      ...exportData.map((note) => [
        note.title,
        note.content.replace(/\n/g, " "),
        note.type,
        note.created,
        note.updated,
        note.starred.toString(),
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Notes exported successfully");
  };

  const sortedNotes = sortNotes(filteredNotes, sortBy, sortOrder);

  if (loading || isLoading) {
    return (
      <div className="hide-scrollbar flex min-h-[calc(100vh-6rem)] flex-col overflow-y-auto">
        <div className="flex flex-1 items-start justify-center py-[var(--space-4)] pt-[var(--space-8)]">
          <div className="w-full max-w-7xl">
            <Card>
              <CardContent className="p-6">
                <TableLoading />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hide-scrollbar flex min-h-[calc(100vh-6rem)] flex-col overflow-y-auto">
      {/* Main Content - Centered and Clean */}
      <div className="flex flex-1 items-start justify-center py-[var(--space-4)] pt-[var(--space-8)]">
        <div className="w-full max-w-7xl space-y-6">
          {/* Controls */}
          <NotesControls
            totalNotes={notes.length}
            selectedCount={selectedNotes.size}
            onSelectAll={handleSelectAll}
            onDeleteSelected={handleDeleteSelected}
            onExportSelected={handleExportSelected}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={() => {}} // Disabled for crypto table
            onSearch={(query) => {
              const filtered = notes.filter(
                (note) =>
                  note.title.toLowerCase().includes(query.toLowerCase()) ||
                  note.content.toLowerCase().includes(query.toLowerCase()) ||
                  note.type.toLowerCase().includes(query.toLowerCase()) ||
                  note.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
              );
              setFilteredNotes(filtered);
            }}
          />

          {/* Table */}
          <NotesCryptoTable
            data={sortedNotes}
            selectedNotes={selectedNotes}
            onRowClick={(note) => handleEditNote(note.id)}
            onTitleClick={(note) => handleEditNote(note.id)}
            onToggleStar={handleToggleStar}
            onTitleEdit={async (noteId: number, newTitle: string) => {
              try {
                const noteToUpdate = notes.find((n) => n.id === noteId);
                if (!noteToUpdate) return;

                // Get Firebase token for authentication
                if (!auth.currentUser) {
                  throw new Error("User not authenticated");
                }
                const token = await auth.currentUser.getIdToken();

                // Update via API
                const response = await fetch(`/api/notes/${noteToUpdate.originalApiId}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    title: newTitle,
                  }),
                });

                if (!response.ok) {
                  throw new Error("Failed to update note title");
                }

                // Update local state
                const updatedNotes = notes.map((note) =>
                  note.id === noteId
                    ? { ...note, title: newTitle, updatedAt: new Date().toISOString().split("T")[0] }
                    : note,
                );
                setNotes(updatedNotes);
                setFilteredNotes(updatedNotes);
                toast.success("Note title updated");
              } catch (error) {
                console.error("Error updating note title:", error);
                toast.error("Failed to update note title");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
