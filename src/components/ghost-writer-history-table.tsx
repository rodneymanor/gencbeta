"use client";

import { useState } from "react";

import { format } from "date-fns";
import { Eye, ExternalLink, Play, ArrowUpDown, Calendar, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ContentIdea } from "@/types/ghost-writer";

interface GhostWriterHistoryTableProps {
  ideas: ContentIdea[];
  onUseIdea: (idea: ContentIdea) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface SortableHeaderProps {
  column: string;
  children: React.ReactNode;
  onSort: (column: string) => void;
  sortBy: string;
  icon?: React.ReactNode;
}

function SortableHeader({ column, children, onSort, sortBy, icon }: SortableHeaderProps) {
  return (
    <Button variant="ghost" onClick={() => onSort(column)} className="h-auto p-0 font-semibold hover:bg-transparent">
      <span className="flex items-center gap-2">
        {icon}
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

export function GhostWriterHistoryTable({ ideas, onUseIdea, onSort, sortBy, sortOrder }: GhostWriterHistoryTableProps) {
  // Helper to get usage stats for an idea
  const getUsageStats = (idea: ContentIdea) => {
    const scripts = idea.generatedScripts || [];
    const usageCount = scripts.length;
    const lastUsed =
      scripts.length > 0 ? format(new Date(scripts[scripts.length - 1].generatedAt), "MMM d, yyyy") : null;

    return { usageCount, lastUsed, allUsageDates: scripts.map((s) => s.generatedAt) };
  };

  // Helper to truncate text
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-gray-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="min-w-[300px]">
                <SortableHeader column="hook" onSort={onSort} sortBy={sortBy}>
                  Hook Content
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader
                  column="hookTemplate"
                  onSort={onSort}
                  sortBy={sortBy}
                  icon={<Tag className="h-4 w-4" />}
                >
                  Template
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="peqCategory" onSort={onSort} sortBy={sortBy}>
                  Category
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader
                  column="createdAt"
                  onSort={onSort}
                  sortBy={sortBy}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  Created
                </SortableHeader>
              </TableHead>
              <TableHead className="text-center">Used in Scripts</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ideas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No ideas found.
                </TableCell>
              </TableRow>
            ) : (
              ideas.map((idea, index) => {
                const { usageCount, lastUsed } = getUsageStats(idea);

                return (
                  <TableRow key={idea.id} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>

                    {/* Hook Content */}
                    <TableCell>
                      <div className="space-y-1">
                        <p className="leading-snug font-medium">{truncateText(idea.hook)}</p>
                        {idea.concept && (
                          <p className="text-muted-foreground text-xs">{truncateText(idea.concept, 60)}</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Hook Template */}
                    <TableCell>
                      {idea.hookTemplate ? (
                        <Badge variant="outline" className="text-xs">
                          {idea.hookTemplate}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>

                    {/* PEQ Category */}
                    <TableCell>
                      {idea.peqCategory ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs capitalize",
                            idea.peqCategory === "problem" && "border-red-200 bg-red-50 text-red-700",
                            idea.peqCategory === "excuse" && "border-yellow-200 bg-yellow-50 text-yellow-700",
                            idea.peqCategory === "question" && "border-blue-200 bg-blue-50 text-blue-700",
                          )}
                        >
                          {idea.peqCategory}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(idea.createdAt), "MMM d, yyyy")}
                    </TableCell>

                    {/* Usage Count */}
                    <TableCell className="text-center">
                      <Badge variant={usageCount > 0 ? "default" : "secondary"} className="text-xs">
                        {usageCount} {usageCount === 1 ? "script" : "scripts"}
                      </Badge>
                    </TableCell>

                    {/* Last Used */}
                    <TableCell className="text-muted-foreground text-sm">{lastUsed || "-"}</TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUseIdea(idea)}
                          className="h-8 w-8 p-0"
                          title="Generate script from this idea"
                        >
                          <Play className="h-4 w-4" />
                        </Button>

                        {/* View Usage Details (if used) */}
                        {usageCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Show usage details modal
                              console.log("Show usage details for", idea.id);
                            }}
                            className="h-8 w-8 p-0"
                            title="View usage history"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
