"use client";

import { useState } from "react";

import { MoreHorizontal, Eye, Edit, Trash2, Copy, Clock, ArrowUpDown, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Script } from "@/types/script";

interface ColumnVisibility {
  title: boolean;
  authors: boolean;
  added: boolean;
  viewed: boolean;
  fileType: boolean;
  summary: boolean;
}

interface ScriptsTableProps {
  scripts: Script[];
  selectedScripts: string[];
  columnVisibility: ColumnVisibility;
  sortBy: string;
  onSelectScript: (scriptId: string) => void;
  onSelectAll: () => void;
  onSort: (column: string) => void;
  onTitleEdit?: (scriptId: string, newTitle: string) => void;
}

// eslint-disable-next-line complexity
export function ScriptsTable({
  scripts,
  selectedScripts,
  columnVisibility,
  sortBy,
  onSelectScript,
  onSelectAll,
  onSort,
  onTitleEdit,
}: ScriptsTableProps) {
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleTitleEdit = (scriptId: string, currentTitle: string) => {
    if (onTitleEdit) {
      setEditingScriptId(scriptId);
      setEditTitle(currentTitle);
    }
  };

  const handleTitleSave = () => {
    if (onTitleEdit && editingScriptId && editTitle.trim()) {
      onTitleEdit(editingScriptId, editTitle.trim());
    }
    setEditingScriptId(null);
    setEditTitle("");
  };

  const handleTitleCancel = () => {
    setEditingScriptId(null);
    setEditTitle("");
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
  return (
    <Card className="overflow-hidden rounded-xl border border-gray-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={selectedScripts.length === scripts.length} onCheckedChange={onSelectAll} />
              </TableHead>
              {columnVisibility.title && (
                <TableHead className="cursor-pointer" onClick={() => onSort("title")}>
                  <div className="flex items-center gap-1">
                    Title
                    {sortBy === "title" && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
              )}
              {columnVisibility.authors && (
                <TableHead className="cursor-pointer" onClick={() => onSort("authors")}>
                  <div className="flex items-center gap-1">
                    Authors
                    {sortBy === "authors" && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
              )}
              {columnVisibility.added && (
                <TableHead className="cursor-pointer" onClick={() => onSort("added")}>
                  <div className="flex items-center gap-1">
                    Added
                    {sortBy === "added" && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
              )}
              {columnVisibility.viewed && (
                <TableHead className="cursor-pointer" onClick={() => onSort("viewed")}>
                  <div className="flex items-center gap-1">
                    Viewed
                    {sortBy === "viewed" && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
              )}
              {columnVisibility.fileType && (
                <TableHead className="cursor-pointer" onClick={() => onSort("fileType")}>
                  <div className="flex items-center gap-1">
                    File type
                    {sortBy === "fileType" && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </TableHead>
              )}
              {columnVisibility.summary && <TableHead>Summary</TableHead>}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scripts.map((script) => (
              <TableRow key={script.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedScripts.includes(script.id)}
                    onCheckedChange={() => onSelectScript(script.id)}
                  />
                </TableCell>
                {columnVisibility.title && (
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {editingScriptId === script.id ? (
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
                          <h4
                            className="cursor-pointer font-medium transition-colors hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTitleEdit(script.id, script.title);
                            }}
                            title="Click to edit title"
                          >
                            {script.title}
                          </h4>
                        )}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        {script.duration}
                        <span>•</span>
                        <span>{script.tags.join(", ")}</span>
                      </div>
                    </div>
                  </TableCell>
                )}
                {columnVisibility.authors && (
                  <TableCell>
                    <span className="text-sm">{script.authors}</span>
                  </TableCell>
                )}
                {columnVisibility.added && (
                  <TableCell>
                    <div className="text-muted-foreground text-sm">
                      {new Date(script.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                )}
                {columnVisibility.viewed && (
                  <TableCell>
                    <div className="text-muted-foreground text-sm">
                      {new Date(script.viewedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                )}
                {columnVisibility.fileType && (
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {script.fileType}
                    </Badge>
                  </TableCell>
                )}
                {columnVisibility.summary && (
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{script.summary}</span>
                  </TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
