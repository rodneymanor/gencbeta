"use client";

import React, { useState } from "react";
import { Star, StarOff, Edit3, Check, X, Calendar, Hash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Icon1 } from "./icon1";

export interface NoteCryptoData {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  starred: boolean;
}

interface NotesCryptoTableProps {
  data: NoteCryptoData[];
  selectedNotes?: Set<number>;
  onRowClick?: (note: NoteCryptoData) => void;
  onToggleStar?: (noteId: number) => void;
  onTitleEdit?: (noteId: number, newTitle: string) => void;
  className?: string;
}

interface SortableHeaderProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function SortableHeader({ children, active = false, onClick }: SortableHeaderProps) {
  return (
    <button
      onClick={onClick}
      className={`
        h-6 rounded-full border-0 px-2 py-0 text-xs font-medium leading-3 transition-all duration-150
        ${active 
          ? "bg-gray-100 text-slate-700" 
          : "bg-transparent text-slate-500 hover:bg-gray-50"
        }
      `}
    >
      {active && (
        <Icon1 className="mr-0.5 inline-flex h-3 w-3 align-middle text-slate-500" />
      )}
      <span className="align-middle">{children}</span>
    </button>
  );
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

function getTagColor(tagName: string): string {
  const tag = availableTags.find((t) => t.name === tagName);
  return tag?.color ?? "bg-gray-500";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateContent(content: string, maxLength: number = 60): string {
  // Remove markdown formatting for preview
  const plainText = content.replace(/[#*>`_-]/g, "").replace(/\n/g, " ");
  return plainText.length > maxLength ? plainText.slice(0, maxLength) + "..." : plainText;
}

interface EditableTitleCellProps {
  note: NoteCryptoData;
  onTitleEdit?: (noteId: number, newTitle: string) => void;
}

function EditableTitleCell({ note, onTitleEdit }: EditableTitleCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);

  const handleEdit = () => {
    if (onTitleEdit) {
      setIsEditing(true);
      setEditTitle(note.title);
    }
  };

  const handleSave = () => {
    if (onTitleEdit && editTitle.trim() !== note.title) {
      onTitleEdit(note.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full pr-1">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-6 text-xs font-medium"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 overflow-hidden pr-1">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center p-1">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
          <span className="text-xs font-medium text-blue-600">
            {note.title.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col bg-transparent py-1">
        <div 
          className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[18px] text-slate-700 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit();
          }}
          title="Click to edit title"
        >
          {note.title}
        </div>
        <div className="whitespace-nowrap text-xs leading-4 text-slate-500">
          {truncateContent(note.content)}
        </div>
      </div>
      {note.starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
    </div>
  );
}

export function NotesCryptoTable({ 
  data, 
  selectedNotes,
  onRowClick,
  onToggleStar,
  onTitleEdit,
  className = ""
}: NotesCryptoTableProps) {
  const handleRowClick = (note: NoteCryptoData) => {
    if (onRowClick) {
      onRowClick(note);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-black ${className}`}>
      <div className="overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[35%]" />
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[10%]" />
            <col className="w-[5%]" />
          </colgroup>
          
          <thead>
            <tr>
              <th className="p-0"></th>
              <th className="py-1 text-center leading-4">
                <SortableHeader active>Tags</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Created</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Updated</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Starred</SortableHeader>
              </th>
              <th className="py-1 pr-1 text-center leading-4">
                <SortableHeader>Edit</SortableHeader>
              </th>
            </tr>
          </thead>
          
          <tbody className="h-[509px]">
            {data.map((note, index) => (
              <tr
                key={note.id}
                onClick={() => handleRowClick(note)}
                className={cn(
                  "cursor-pointer border-t border-gray-200 hover:bg-gray-100",
                  selectedNotes?.has(note.id) && "bg-blue-50"
                )}
              >
                {/* Note Info Cell */}
                <td className="overflow-hidden text-ellipsis whitespace-nowrap border-r border-gray-200 p-1">
                  <EditableTitleCell note={note} onTitleEdit={onTitleEdit} />
                </td>
                
                {/* Tags */}
                <td className="border border-gray-200 bg-gray-100/30">
                  <div className="flex flex-wrap gap-1 justify-center py-1">
                    {note.tags.slice(0, 2).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className={cn("text-xs text-white h-4 px-1", getTagColor(tag))}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        +{note.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                
                {/* Created Date */}
                <td className="border border-gray-200">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {formatDate(note.createdAt)}
                  </div>
                </td>
                
                {/* Updated Date */}
                <td className="border border-gray-200">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {formatDate(note.updatedAt)}
                  </div>
                </td>
                
                {/* Starred */}
                <td className="border border-gray-200">
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar?.(note.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      {note.starred ? (
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-3 w-3 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </td>
                
                {/* Edit Action */}
                <td className={`border-l border-t border-gray-200 ${index === data.length - 1 ? '' : 'border-b'}`}>
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(note);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="h-3 w-3 text-slate-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NotesCryptoTable;