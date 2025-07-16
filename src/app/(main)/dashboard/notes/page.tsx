"use client";

import { useState, useEffect } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableLoading } from "@/components/ui/loading-animations";
import { useTopBarConfig } from "@/hooks/use-route-topbar";

import { NotesControls } from "./_components/notes-controls";
import { NotesTable } from "./_components/notes-table";

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  starred: boolean;
}

interface ColumnVisibility {
  title: boolean;
  tags: boolean;
  created: boolean;
  updated: boolean;
  starred: boolean;
  content: boolean;
}

// Mock notes data - same as capture page
const mockNotes: Note[] = [
  {
    id: 1,
    title: "Morning Routine Ideas",
    content:
      '# Morning Routine Strategy\n\nKey insights for content:\n- Most people focus on what they do, not when they do it\n- First 10 minutes are crucial for setting intention\n- **Three-step framework:**\n  1. Hydrate before caffeinate\n  2. Set one clear intention\n  3. Move your body (even 2 minutes)\n\n> This could work as a TikTok series - one video per step\n\n**Potential hooks:**\n- "What if I told you 90% of people do morning routines wrong?"\n- "The first 10 minutes of your day determine everything"',
    tags: ["morning", "routine", "productivity", "tiktok"],
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
    starred: true,
  },
  {
    id: 2,
    title: "Content Ideas - Tech Reviews",
    content:
      "## Tech Review Framework\n\n**Structure:**\n1. Hook with personal story\n2. Show the product in action\n3. Honest pros and cons\n4. Who it's perfect for\n5. Call to action\n\n**Upcoming reviews:**\n- New iPhone features for creators\n- Budget microphone comparison\n- Editing apps for beginners\n\n*Note: Focus on creator-specific use cases*",
    tags: ["tech", "reviews", "content", "structure"],
    createdAt: "2024-01-18",
    updatedAt: "2024-01-19",
    starred: false,
  },
  {
    id: 3,
    title: "Storytelling Techniques",
    content:
      "Personal storytelling for social media:\n\n**The 3-Act Structure:**\n- Setup: Where I was\n- Conflict: What went wrong\n- Resolution: How I changed\n\n**Emotional hooks:**\n- Start with the end result\n- Use specific details\n- Include vulnerable moments\n- End with actionable advice\n\nRemember: People connect with struggle, not success.",
    tags: ["storytelling", "social media", "engagement"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-16",
    starred: true,
  },
  {
    id: 4,
    title: "Video Production Tips",
    content:
      "Essential tips for better video content:\n\n**Technical basics:**\n- Good lighting is more important than expensive cameras\n- Audio quality can make or break your content\n- Stable shots using tripods or phone gimbals\n\n**Content tips:**\n- Hook viewers in the first 3 seconds\n- Keep energy high throughout\n- End with clear call-to-action\n\n**Post-production:**\n- Quick cuts maintain attention\n- Add captions for accessibility\n- Consistent branding across videos",
    tags: ["video", "production", "tips", "technical"],
    createdAt: "2024-01-12",
    updatedAt: "2024-01-14",
    starred: false,
  },
  {
    id: 5,
    title: "Social Media Trends 2024",
    content:
      "Key trends to watch this year:\n\n**Platform trends:**\n- Short-form video continues to dominate\n- Live streaming becoming more interactive\n- AI-generated content gaining traction\n\n**Content trends:**\n- Authentic behind-the-scenes content\n- Educational micro-learning\n- Community-driven challenges\n\n**Monetization trends:**\n- Creator funds expanding\n- Direct fan support features\n- Product placement evolution",
    tags: ["trends", "social media", "2024", "strategy"],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-11",
    starred: true,
  },
];

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
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(mockNotes);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    title: true,
    tags: true,
    created: true,
    updated: true,
    starred: true,
    content: false,
  });

  // Configure top bar
  const { setTopBarConfig } = useTopBarConfig();

  const handleCreateNote = () => {
    window.location.href = "/dashboard/capture/new";
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedNotes = notes.filter((note) => !selectedNotes.has(note.id));
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
      setSelectedNotes(new Set());

      toast.success(`Deleted ${selectedNotes.size} note(s)`);
    } catch {
      toast.error("Failed to delete notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStar = async (noteId: number) => {
    const updatedNotes = notes.map((note) => (note.id === noteId ? { ...note, starred: !note.starred } : note));
    setNotes(updatedNotes);
    setFilteredNotes(updatedNotes);

    const note = updatedNotes.find((n) => n.id === noteId);
    toast.success(note?.starred ? "Note starred" : "Note unstarred");
  };

  const handleEditNote = (noteId: number) => {
    window.location.href = `/dashboard/capture/notes?noteId=${noteId}`;
  };

  const handleExportSelected = () => {
    if (selectedNotes.size === 0) return;

    const selectedNotesData = notes.filter((note) => selectedNotes.has(note.id));
    const exportData = selectedNotesData.map((note) => ({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
      created: note.createdAt,
      updated: note.updatedAt,
      starred: note.starred,
    }));

    const csvContent = [
      ["Title", "Content", "Tags", "Created", "Updated", "Starred"],
      ...exportData.map((note) => [
        note.title,
        note.content.replace(/\n/g, " "),
        note.tags,
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

  if (isLoading) {
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
            onColumnVisibilityChange={setColumnVisibility}
            onSearch={(query) => {
              const filtered = notes.filter(
                (note) =>
                  note.title.toLowerCase().includes(query.toLowerCase()) ||
                  note.content.toLowerCase().includes(query.toLowerCase()) ||
                  note.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
              );
              setFilteredNotes(filtered);
            }}
          />

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <NotesTable
                notes={sortedNotes}
                selectedNotes={selectedNotes}
                sortBy={sortBy}
                sortOrder={sortOrder}
                columnVisibility={columnVisibility}
                onSort={handleSort}
                onSelectNote={handleSelectNote}
                onSelectAll={handleSelectAll}
                onToggleStar={handleToggleStar}
                onEdit={handleEditNote}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
