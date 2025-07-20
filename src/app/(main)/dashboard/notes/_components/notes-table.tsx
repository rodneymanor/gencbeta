"use client";

import { useState } from "react";

import { ArrowUpDown, Star, StarOff, Edit3, Calendar, Hash, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

interface NotesTableProps {
  notes: Note[];
  selectedNotes: Set<number>;
  sortBy: string;
  sortOrder?: "asc" | "desc";
  columnVisibility: ColumnVisibility;
  onSort: (column: string) => void;
  onSelectNote: (noteId: number) => void;
  onSelectAll: () => void;
  onToggleStar: (noteId: number) => void;
  onEdit: (noteId: number) => void;
  onTitleEdit?: (noteId: number, newTitle: string) => void;
}

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
  { name: "video", color: "bg-orange-500" },
  { name: "production", color: "bg-cyan-500" },
  { name: "tips", color: "bg-teal-500" },
  { name: "technical", color: "bg-slate-500" },
  { name: "trends", color: "bg-rose-500" },
  { name: "strategy", color: "bg-amber-500" },
];

function SortableHeader({
  column,
  children,
  onSort,
  sortBy,
}: {
  column: string;
  children: React.ReactNode;
  onSort: (column: string) => void;
  sortBy: string;
}) {
  return (
    <Button variant="ghost" onClick={() => onSort(column)} className="h-auto p-0 font-semibold hover:bg-transparent">
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={cn(
            "h-4 w-4 transition-all",
            sortBy === column ? "text-foreground" : "text-muted-foreground opacity-50",
          )}
        />
      </span>
    </Button>
  );
}

function NoteTableRow({
  note,
  columnVisibility,
  selectedNotes,
  onSelectNote,
  onToggleStar,
  onEdit,
  onTitleEdit,
  getTagColor,
  formatDate,
  truncateContent,
}: {
  note: Note;
  columnVisibility: ColumnVisibility;
  selectedNotes: Set<number>;
  onSelectNote: (noteId: number) => void;
  onToggleStar: (noteId: number) => void;
  onEdit: (noteId: number) => void;
  onTitleEdit?: (noteId: number, newTitle: string) => void;
  getTagColor: (tagName: string) => string;
  formatDate: (dateString: string) => string;
  truncateContent: (content: string, maxLength?: number) => string;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);

  const handleTitleEdit = () => {
    if (onTitleEdit) {
      setIsEditingTitle(true);
      setEditTitle(note.title);
    }
  };

  const handleTitleSave = () => {
    if (onTitleEdit && editTitle.trim() !== note.title) {
      onTitleEdit(note.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(note.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleTitleCancel();
    }
  };
  const renderStarredCell = () => (
    <TableCell>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(note.id);
        }}
        className="h-8 w-8 p-0"
      >
        {note.starred ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="h-4 w-4" />}
      </Button>
    </TableCell>
  );

  const renderTagsCell = () => (
    <TableCell>
      <div className="flex flex-wrap gap-1">
        {note.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className={cn("text-xs text-white", getTagColor(tag))}>
            {tag}
          </Badge>
        ))}
        {note.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{note.tags.length - 3}
          </Badge>
        )}
      </div>
    </TableCell>
  );

  return (
    <TableRow
      className={cn("cursor-pointer", selectedNotes.has(note.id) && "bg-muted/50")}
      onClick={() => onSelectNote(note.id)}
    >
      <TableCell>
        <Checkbox
          checked={selectedNotes.has(note.id)}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => onSelectNote(note.id)}
        />
      </TableCell>

      {columnVisibility.starred && renderStarredCell()}

      {columnVisibility.title && (
        <TableCell>
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex flex-1 items-center gap-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="h-8 text-sm font-medium"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleSave();
                  }}
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleCancel();
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span
                  className="cursor-pointer font-medium transition-colors hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleEdit();
                  }}
                  title="Click to edit title"
                >
                  {note.title}
                </span>
                {note.starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
              </>
            )}
          </div>
        </TableCell>
      )}

      {columnVisibility.tags && renderTagsCell()}

      {columnVisibility.content && (
        <TableCell>
          <div className="text-muted-foreground max-w-md text-sm">{truncateContent(note.content)}</div>
        </TableCell>
      )}

      {columnVisibility.created && (
        <TableCell className="text-muted-foreground text-sm">{formatDate(note.createdAt)}</TableCell>
      )}

      {columnVisibility.updated && (
        <TableCell className="text-muted-foreground text-sm">{formatDate(note.updatedAt)}</TableCell>
      )}

      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note.id);
          }}
          className="h-8 w-8 p-0"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function NotesTable({
  notes,
  selectedNotes,
  sortBy,
  columnVisibility,
  onSort,
  onSelectNote,
  onSelectAll,
  onToggleStar,
  onEdit,
  onTitleEdit,
}: Omit<NotesTableProps, "sortOrder">) {
  const getTagColor = (tagName: string) => {
    const tag = availableTags.find((t) => t.name === tagName);
    return tag?.color ?? "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    // Remove markdown formatting for preview
    const plainText = content.replace(/[#*>`_-]/g, "").replace(/\n/g, " ");
    return plainText.length > maxLength ? plainText.slice(0, maxLength) + "..." : plainText;
  };

  const allSelected = notes.length > 0 && selectedNotes.size === notes.length;
  const someSelected = selectedNotes.size > 0 && selectedNotes.size < notes.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onCheckedChange={onSelectAll}
              />
            </TableHead>

            {columnVisibility.starred && (
              <TableHead className="w-12">
                <Star className="h-4 w-4" />
              </TableHead>
            )}

            {columnVisibility.title && (
              <TableHead>
                <SortableHeader column="title" onSort={onSort} sortBy={sortBy}>
                  Title
                </SortableHeader>
              </TableHead>
            )}

            {columnVisibility.tags && (
              <TableHead>
                <div className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  Tags
                </div>
              </TableHead>
            )}

            {columnVisibility.content && <TableHead>Content Preview</TableHead>}

            {columnVisibility.created && (
              <TableHead>
                <SortableHeader column="created" onSort={onSort} sortBy={sortBy}>
                  <Calendar className="h-4 w-4" />
                  Created
                </SortableHeader>
              </TableHead>
            )}

            {columnVisibility.updated && (
              <TableHead>
                <SortableHeader column="updated" onSort={onSort} sortBy={sortBy}>
                  <Calendar className="h-4 w-4" />
                  Updated
                </SortableHeader>
              </TableHead>
            )}

            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No notes found.
              </TableCell>
            </TableRow>
          ) : (
            notes.map((note) => (
              <NoteTableRow
                key={note.id}
                note={note}
                columnVisibility={columnVisibility}
                selectedNotes={selectedNotes}
                onSelectNote={onSelectNote}
                onToggleStar={onToggleStar}
                onEdit={onEdit}
                onTitleEdit={onTitleEdit}
                getTagColor={getTagColor}
                formatDate={formatDate}
                truncateContent={truncateContent}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
