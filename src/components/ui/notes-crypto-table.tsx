"use client";

import React, { useState } from "react";
import { Star, StarOff, Edit3, Check, X, Calendar, Hash } from "lucide-react";
import { 
  IconVideo, 
  IconMicrophone, 
  IconFileText, 
  IconPuzzle, 
  IconBrowser, 
  IconCamera, 
  IconCameraSelfie, 
  IconMusic 
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Icon1 } from "./icon1";

export interface NoteCryptoData {
  id: number;
  title: string;
  content: string;
  type: string; // Note type: 'youtube', 'voice', 'text', 'chrome-extension', 'webpage', etc.
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
  onTitleClick?: (note: NoteCryptoData) => void;
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

const noteTypeConfig = {
  "youtube": { 
    label: "YouTube", 
    bgColor: "bg-red-500/10", 
    textColor: "text-red-600",
    borderColor: "border-red-500/20",
    icon: <IconVideo className="mr-1 h-2.5 w-2.5" />
  },
  "voice": { 
    label: "Voice", 
    bgColor: "bg-purple-500/10", 
    textColor: "text-purple-600",
    borderColor: "border-purple-500/20",
    icon: <IconMicrophone className="mr-1 h-2.5 w-2.5" />
  },
  "text": { 
    label: "Text", 
    bgColor: "bg-slate-500/10", 
    textColor: "text-slate-600",
    borderColor: "border-slate-500/20",
    icon: <IconFileText className="mr-1 h-2.5 w-2.5" />
  },
  "chrome-extension": { 
    label: "Extension", 
    bgColor: "bg-blue-500/10", 
    textColor: "text-blue-600",
    borderColor: "border-blue-500/20",
    icon: <IconPuzzle className="mr-1 h-2.5 w-2.5" />
  },
  "webpage": { 
    label: "Web Page", 
    bgColor: "bg-green-500/10", 
    textColor: "text-green-600",
    borderColor: "border-green-500/20",
    icon: <IconBrowser className="mr-1 h-2.5 w-2.5" />
  },
  "video": { 
    label: "Video", 
    bgColor: "bg-orange-500/10", 
    textColor: "text-orange-600",
    borderColor: "border-orange-500/20",
    icon: <IconCamera className="mr-1 h-2.5 w-2.5" />
  },
  "instagram": { 
    label: "Instagram", 
    bgColor: "bg-pink-500/10", 
    textColor: "text-pink-600",
    borderColor: "border-pink-500/20",
    icon: <IconCameraSelfie className="mr-1 h-2.5 w-2.5" />
  },
  "tiktok": { 
    label: "TikTok", 
    bgColor: "bg-slate-900/10", 
    textColor: "text-slate-700",
    borderColor: "border-slate-900/20",
    icon: <IconMusic className="mr-1 h-2.5 w-2.5" />
  }
};

function getNoteTypeConfig(noteType: string) {
  return noteTypeConfig[noteType as keyof typeof noteTypeConfig] || {
    label: noteType ? noteType.charAt(0).toUpperCase() + noteType.slice(1) : "Unknown",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-600",
    borderColor: "border-gray-500/20",
    icon: <IconFileText className="mr-1 h-2.5 w-2.5" />
  };
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
  onTitleClick?: (note: NoteCryptoData) => void;
}

function EditableTitleCell({ note, onTitleEdit, onTitleClick }: EditableTitleCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTitleEdit) {
      setIsEditing(true);
      setEditTitle(note.title);
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTitleClick) {
      onTitleClick(note);
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
    <div 
      className="flex w-full items-center gap-2 overflow-hidden pr-1 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center p-1">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
          <span className="text-xs font-medium text-blue-600">
            {note.title.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col bg-transparent py-1 flex-1">
        <div className="flex items-center gap-1 overflow-hidden">
          <div 
            className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[18px] text-slate-700 cursor-pointer hover:text-blue-600 transition-colors flex-1"
            onClick={handleTitleClick}
            title="Click to open note"
          >
            {note.title}
          </div>
          {onTitleEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className={`h-4 w-4 p-0 text-slate-400 hover:text-slate-600 transition-all duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              title="Edit title"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
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
  onTitleClick,
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
                <SortableHeader active>Type</SortableHeader>
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
                  "cursor-pointer border-t border-gray-200 hover:bg-gray-100 h-[50px] max-h-[50px]",
                  selectedNotes?.has(note.id) && "bg-blue-50"
                )}
              >
                {/* Note Info Cell */}
                <td className="overflow-hidden text-ellipsis whitespace-nowrap border-r border-gray-200 p-1">
                  <EditableTitleCell note={note} onTitleEdit={onTitleEdit} onTitleClick={onTitleClick} />
                </td>
                
                {/* Note Type */}
                <td className="border border-gray-200 bg-gray-100/30">
                  <div className="flex justify-center py-1">
                    {(() => {
                      const typeConfig = getNoteTypeConfig(note.type);
                      return (
                        <span 
                          data-slot="badge" 
                          className={cn(
                            "inline-flex items-center justify-center font-normal w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-[var(--space-1)] [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden rounded-lg border px-2 py-0.5 text-xs",
                            typeConfig.bgColor, 
                            typeConfig.textColor,
                            typeConfig.borderColor
                          )}
                        >
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      );
                    })()}
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
            
            {/* Add placeholder rows to ensure proper row height distribution */}
            {Array.from({ length: Math.max(0, 10 - data.length) }, (_, index) => (
              <tr key={`placeholder-${index}`} className="border-t border-gray-200 h-[50px] max-h-[50px]">
                <td className="border-r border-gray-200 p-1">&nbsp;</td>
                <td className="border border-gray-200 bg-gray-100/30">&nbsp;</td>
                <td className="border border-gray-200">&nbsp;</td>
                <td className="border border-gray-200">&nbsp;</td>
                <td className="border border-gray-200">&nbsp;</td>
                <td className="border-l border-t border-gray-200">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NotesCryptoTable;