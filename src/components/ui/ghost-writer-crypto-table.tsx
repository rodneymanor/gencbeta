"use client";

import React from "react";
import { Play, Eye, Calendar, Tag, Hash } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContentIdea } from "@/types/ghost-writer";
import { Icon1 } from "./icon1";

export interface GhostWriterCryptoData extends ContentIdea {
  // Additional computed fields for display
  usageCount?: number;
  lastUsed?: string;
}

interface GhostWriterCryptoTableProps {
  data: GhostWriterCryptoData[];
  selectedIdeas?: string[];
  onRowClick?: (idea: GhostWriterCryptoData) => void;
  onUseIdea?: (idea: GhostWriterCryptoData) => void;
  onViewUsage?: (idea: GhostWriterCryptoData) => void;
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

function truncateText(text: string, maxLength: number = 60): string {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), "MMM d, yyyy");
}

function getUsageStats(idea: GhostWriterCryptoData) {
  const scripts = idea.generatedScripts || [];
  const usageCount = scripts.length;
  const lastUsed = scripts.length > 0 
    ? format(new Date(scripts[scripts.length - 1].generatedAt), "MMM d, yyyy") 
    : null;
  
  return { usageCount, lastUsed };
}

function getTemplateIcon(template: string): string {
  // Return first letter of template in uppercase
  return template ? template.charAt(0).toUpperCase() : "?";
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "problem":
      return "border-red-200 bg-red-50 text-red-700";
    case "excuse":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "question":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export function GhostWriterCryptoTable({ 
  data, 
  selectedIdeas,
  onRowClick,
  onUseIdea,
  onViewUsage,
  className = ""
}: GhostWriterCryptoTableProps) {
  const handleRowClick = (idea: GhostWriterCryptoData) => {
    if (onRowClick) {
      onRowClick(idea);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-black ${className}`}>
      <div className="overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[35%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[5%]" />
          </colgroup>
          
          <thead>
            <tr>
              <th className="p-0"></th>
              <th className="py-1 text-center leading-4">
                <SortableHeader active>Template</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Category</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Created</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Usage</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Last Used</SortableHeader>
              </th>
              <th className="py-1 pr-1 text-center leading-4">
                <SortableHeader>Action</SortableHeader>
              </th>
            </tr>
          </thead>
          
          <tbody className="h-[509px]">
            {data.map((idea, index) => {
              const { usageCount, lastUsed } = getUsageStats(idea);
              
              return (
                <tr
                  key={idea.id}
                  onClick={() => handleRowClick(idea)}
                  className={cn(
                    "cursor-pointer border-t border-gray-200 hover:bg-gray-100",
                    selectedIdeas?.includes(idea.id) && "bg-green-50"
                  )}
                >
                  {/* Hook Content Cell */}
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap border-r border-gray-200 p-1">
                    <div className="flex w-full items-center gap-2 overflow-hidden pr-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center p-1">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100">
                          <span className="text-xs font-medium text-green-600">
                            {getTemplateIcon(idea.hookTemplate || "")}
                          </span>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-col bg-transparent py-1">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[18px] text-slate-700">
                          {truncateText(idea.hook)}
                        </div>
                        <div className="whitespace-nowrap text-xs leading-4 text-slate-500">
                          {idea.concept && truncateText(idea.concept, 40)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Hook Template */}
                  <td className="border border-gray-200 bg-gray-100/30">
                    <div className="flex justify-center">
                      {idea.hookTemplate ? (
                        <Badge variant="outline" className="text-xs">
                          {truncateText(idea.hookTemplate, 12)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  
                  {/* PEQ Category */}
                  <td className="border border-gray-200">
                    <div className="flex justify-center">
                      {idea.peqCategory ? (
                        <Badge
                          variant="outline"
                          className={cn("text-xs capitalize", getCategoryColor(idea.peqCategory))}
                        >
                          {idea.peqCategory}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Created Date */}
                  <td className="border border-gray-200">
                    <div className="text-center text-xs font-normal leading-4 text-slate-500">
                      {formatDate(idea.createdAt)}
                    </div>
                  </td>
                  
                  {/* Usage Count */}
                  <td className="border border-gray-200">
                    <div className="flex justify-center">
                      <Badge 
                        variant={usageCount > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {usageCount} {usageCount === 1 ? "script" : "scripts"}
                      </Badge>
                    </div>
                  </td>
                  
                  {/* Last Used */}
                  <td className="border border-gray-200">
                    <div className="text-center text-xs font-normal leading-4 text-slate-500">
                      {lastUsed || "-"}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className={`border-l border-t border-gray-200 ${index === data.length - 1 ? '' : 'border-b'}`}>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseIdea?.(idea);
                        }}
                        className="h-6 w-6 p-0"
                        title="Generate script from this idea"
                      >
                        <Play className="h-3 w-3 text-green-600" />
                      </Button>
                      
                      {/* View Usage Details (if used) */}
                      {usageCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewUsage?.(idea);
                          }}
                          className="h-6 w-6 p-0"
                          title="View usage history"
                        >
                          <Eye className="h-3 w-3 text-slate-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GhostWriterCryptoTable;