"use client";

import { ArrowUpDown, Star, StarOff, Edit3, Calendar, Hash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  sortOrder: "asc" | "desc";
  columnVisibility: ColumnVisibility;
  onSort: (column: string) => void;
  onSelectNote: (noteId: number) => void;
  onSelectAll: () => void;
  onToggleStar: (noteId: number) => void;
  onEdit: (noteId: number) => void;
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

export function NotesTable({
  notes,
  selectedNotes,
  sortBy,
  sortOrder,
  columnVisibility,
  onSort,
  onSelectNote,
  onSelectAll,
  onToggleStar,
  onEdit,
}: NotesTableProps) {
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

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => onSort(column)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={cn(
            "h-4 w-4 transition-all",
            sortBy === column
              ? "text-foreground"
              : "text-muted-foreground opacity-50"
          )}
        />
      </span>
    </Button>
  );

  const allSelected = notes.length > 0 && selectedNotes.size === notes.length;
  const someSelected = selectedNotes.size > 0 && selectedNotes.size < notes.length;

  return (
    <div className="rounded-md border">
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
                <SortableHeader column="title">Title</SortableHeader>
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
            
            {columnVisibility.content && (
              <TableHead>Content Preview</TableHead>
            )}
            
            {columnVisibility.created && (
              <TableHead>
                <SortableHeader column="created">
                  <Calendar className="h-4 w-4" />
                  Created
                </SortableHeader>
              </TableHead>
            )}
            
            {columnVisibility.updated && (
              <TableHead>
                <SortableHeader column="updated">
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
              <TableRow
                key={note.id}
                className={cn(
                  "cursor-pointer",
                  selectedNotes.has(note.id) && "bg-muted/50"
                )}
                onClick={() => onSelectNote(note.id)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedNotes.has(note.id)}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => onSelectNote(note.id)}
                  />
                </TableCell>
                
                {columnVisibility.starred && (
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
                      {note.starred ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                )}
                
                {columnVisibility.title && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{note.title}</span>
                      {note.starred && (
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </TableCell>
                )}
                
                {columnVisibility.tags && (
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={cn(
                            "text-xs text-white",
                            getTagColor(tag)
                          )}
                        >
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
                )}
                
                {columnVisibility.content && (
                  <TableCell>
                    <div className="max-w-md text-sm text-muted-foreground">
                      {truncateContent(note.content)}
                    </div>
                  </TableCell>
                )}
                
                {columnVisibility.created && (
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </TableCell>
                )}
                
                {columnVisibility.updated && (
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(note.updatedAt)}
                  </TableCell>
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}