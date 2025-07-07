"use client";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchResult } from "@/lib/search-service";

interface SearchResultGroupProps {
  title: string;
  items: SearchResult[];
  emptyMessage: string;
  onSelect: (result: SearchResult) => void;
  formatDate: (dateString: string) => string;
}

export function SearchResultGroup({ title, items, onSelect, formatDate }: SearchResultGroupProps) {
  if (items.length === 0) return null;

  return (
    <>
      <CommandSeparator />
      <CommandGroup heading={title}>
        {items.map((item) => (
          <CommandItem
            key={`${title.toLowerCase()}-${item.id}`}
            className="cursor-pointer !py-2"
            onSelect={() => onSelect(item)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.title}</span>
                {item.metadata?.category && (
                  <Badge variant="secondary" className="text-xs">
                    {item.metadata.category}
                  </Badge>
                )}
                {item.metadata?.createdAt && (
                  <span className="text-muted-foreground text-xs">{formatDate(item.metadata.createdAt)}</span>
                )}
              </div>
              {item.description && (
                <div className="text-muted-foreground mt-1 line-clamp-1 text-xs">{item.description}</div>
              )}
            </div>
            <ArrowRight className="ml-2 h-3 w-3 opacity-50" />
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

export function SearchLoadingState() {
  return (
    <CommandGroup heading="Loading...">
      {Array.from({ length: 3 }).map((_, i) => (
        <CommandItem key={i} className="cursor-pointer !py-2">
          <Skeleton className="mr-2 h-4 w-4" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-48" />
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

interface QuickActionProps {
  action: {
    id: string;
    title: string;
    description: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  onSelect: (action: { id: string; title: string; description: string; url: string }) => void;
}

export function QuickActionItem({ action, onSelect }: QuickActionProps) {
  return (
    <CommandItem key={action.id} className="cursor-pointer !py-2" onSelect={() => onSelect(action)}>
      <action.icon className="mr-2 h-4 w-4" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{action.title}</span>
        </div>
        <div className="text-muted-foreground mt-1 text-xs">{action.description}</div>
      </div>
      <ArrowRight className="ml-2 h-3 w-3 opacity-50" />
    </CommandItem>
  );
}
