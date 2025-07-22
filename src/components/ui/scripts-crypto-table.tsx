"use client";

import React, { useState } from "react";
import { Clock, Edit3, Check, X, MoreHorizontal, Copy, Trash2, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Icon1 } from "./icon1";

// Script source configuration for indicators and colors
const scriptSourceConfig = {
  "ghostwriter": { 
    indicator: "G", 
    bgColor: "bg-purple-100", 
    textColor: "text-purple-600",
    label: "Ghost Writer"
  },
  "ideas": { 
    indicator: "I", 
    bgColor: "bg-blue-100", 
    textColor: "text-blue-600",
    label: "Ideas/Notes"
  },
  "scripting": { 
    indicator: "S", 
    bgColor: "bg-green-100", 
    textColor: "text-green-600",
    label: "Manual Scripting"
  },
  "hooks": { 
    indicator: "H", 
    bgColor: "bg-orange-100", 
    textColor: "text-orange-600",
    label: "Hooks"
  },
  "collections": { 
    indicator: "C", 
    bgColor: "bg-teal-100", 
    textColor: "text-teal-600",
    label: "Collections"
  }
};

function getSourceIndicator(source?: string): { indicator: string; bgColor: string; textColor: string; label: string } {
  if (source && source in scriptSourceConfig) {
    return scriptSourceConfig[source as keyof typeof scriptSourceConfig];
  }
  // Default fallback (for legacy scripts without source)
  return {
    indicator: "S",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    label: "Unknown"
  };
}

export interface ScriptCryptoData {
  id: string;
  title: string;
  authors: string;
  createdAt: string;
  viewedAt: string;
  fileType: string;
  summary: string;
  duration: string;
  tags: string[];
  source?: "ghostwriter" | "ideas" | "scripting" | "hooks" | "collections";
}

interface ScriptsCryptoTableProps {
  data: ScriptCryptoData[];
  selectedScripts?: string[];
  onRowClick?: (script: ScriptCryptoData) => void;
  onTitleEdit?: (scriptId: string, newTitle: string) => void;
  onView?: (scriptId: string) => void;
  onEdit?: (scriptId: string) => void;
  onDuplicate?: (scriptId: string) => void;
  onDelete?: (scriptId: string) => void;
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateText(text: string, maxLength: number = 40): string {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

interface EditableTitleCellProps {
  script: ScriptCryptoData;
  onTitleEdit?: (scriptId: string, newTitle: string) => void;
}

function EditableTitleCell({ script, onTitleEdit }: EditableTitleCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(script.title);

  const handleEdit = () => {
    if (onTitleEdit) {
      setIsEditing(true);
      setEditTitle(script.title);
    }
  };

  const handleSave = () => {
    if (onTitleEdit && editTitle.trim() !== script.title) {
      onTitleEdit(script.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(script.title);
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
        <div className={`flex h-6 w-6 items-center justify-center rounded ${getSourceIndicator(script.source).bgColor}`}>
          <span className={`text-xs font-medium ${getSourceIndicator(script.source).textColor}`}>
            {getSourceIndicator(script.source).indicator}
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
          {script.title}
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap text-xs leading-4 text-slate-500">
          <Clock className="h-3 w-3" />
          {script.duration}
          <span>•</span>
          <span>{script.tags.slice(0, 2).join(", ")}</span>
          {script.tags.length > 2 && <span>+{script.tags.length - 2}</span>}
        </div>
      </div>
    </div>
  );
}

export function ScriptsCryptoTable({ 
  data, 
  selectedScripts,
  onRowClick,
  onTitleEdit,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  className = ""
}: ScriptsCryptoTableProps) {
  const handleRowClick = (script: ScriptCryptoData) => {
    if (onRowClick) {
      onRowClick(script);
    }
  };

  const getFileTypeColor = (fileType: string): string => {
    switch (fileType.toLowerCase()) {
      case 'script': return 'text-blue-600';
      case 'template': return 'text-green-600';
      case 'draft': return 'text-yellow-600';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-black ${className}`}>
      <div className="overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[16%]" />
            <col className="w-[5%]" />
          </colgroup>
          
          <thead>
            <tr>
              <th className="p-0"></th>
              <th className="py-1 text-center leading-4">
                <SortableHeader active>Authors</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Created</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Viewed</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Type</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Summary</SortableHeader>
              </th>
              <th className="py-1 pr-1 text-center leading-4">
                <SortableHeader>Actions</SortableHeader>
              </th>
            </tr>
          </thead>
          
          <tbody className="h-[509px]">
            {data.map((script, index) => (
              <tr
                key={script.id}
                onClick={() => handleRowClick(script)}
                className={cn(
                  "cursor-pointer border-t border-gray-200 hover:bg-gray-100",
                  selectedScripts?.includes(script.id) && "bg-purple-50"
                )}
              >
                {/* Script Info Cell */}
                <td className="overflow-hidden text-ellipsis whitespace-nowrap border-r border-gray-200 p-1">
                  <EditableTitleCell script={script} onTitleEdit={onTitleEdit} />
                </td>
                
                {/* Authors */}
                <td className="border border-gray-200 bg-gray-100/30">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {truncateText(script.authors, 20)}
                  </div>
                </td>
                
                {/* Created Date */}
                <td className="border border-gray-200">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {formatDate(script.createdAt)}
                  </div>
                </td>
                
                {/* Viewed Date */}
                <td className="border border-gray-200">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {formatDate(script.viewedAt)}
                  </div>
                </td>
                
                {/* File Type */}
                <td className="border border-gray-200">
                  <div className="flex justify-center">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getFileTypeColor(script.fileType))}
                    >
                      {script.fileType}
                    </Badge>
                  </div>
                </td>
                
                {/* Summary */}
                <td className="border border-gray-200">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {truncateText(script.summary, 30)}
                  </div>
                </td>
                
                {/* Actions */}
                <td className={`border-l border-t border-gray-200 ${index === data.length - 1 ? '' : 'border-b'}`}>
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-3 w-3 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onView?.(script.id);
                          }}
                          className="gap-2 text-xs"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(script.id);
                          }}
                          className="gap-2 text-xs"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate?.(script.id);
                          }}
                          className="gap-2 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(script.id);
                          }}
                          className="gap-2 text-xs text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default ScriptsCryptoTable;