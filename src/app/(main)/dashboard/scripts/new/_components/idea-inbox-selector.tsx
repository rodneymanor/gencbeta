"use client";

import { useState, useEffect } from "react";

import { Search, Star, Plus, X, Lightbulb, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { IdeaContextConfig, getRecommendedContextMode } from "@/lib/prompts/modifiers/idea-context";
import { clientNotesService, Note } from "@/lib/services/client-notes-service";

interface IdeaInboxSelectorProps {
  onSelectionChange: (config: IdeaContextConfig | null) => void;
  className?: string;
  disabled?: boolean;
}

export function IdeaInboxSelector({ onSelectionChange, className, disabled }: IdeaInboxSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMode, setContextMode] = useState<IdeaContextConfig["contextMode"]>("inspiration");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notes when component opens
  useEffect(() => {
    if (isOpen && notes.length === 0) {
      loadNotes();
    }
  }, [isOpen]);

  // Update filtered notes when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      );
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes(notes);
    }
  }, [searchTerm, notes]);

  // Update context mode based on selected notes
  useEffect(() => {
    if (selectedNotes.length > 0) {
      const recommended = getRecommendedContextMode(selectedNotes);
      setContextMode(recommended);
    }
  }, [selectedNotes]);

  // Notify parent of selection changes
  useEffect(() => {
    if (selectedNotes.length > 0) {
      const config: IdeaContextConfig = {
        selectedNotes,
        contextMode,
        maxContextLength: 2000,
        includeMetadata: true,
      };
      onSelectionChange(config);
    } else {
      onSelectionChange(null);
    }
  }, [selectedNotes, contextMode, onSelectionChange]);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientNotesService.getIdeaInboxNotes();
      setNotes(response.notes);
      setFilteredNotes(response.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) => {
      const isSelected = prev.some((n) => n.id === note.id);
      if (isSelected) {
        return prev.filter((n) => n.id !== note.id);
      } else {
        // Limit to 5 notes for performance
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, note];
      }
    });
  };

  const clearSelection = () => {
    setSelectedNotes([]);
    onSelectionChange(null);
  };

  const closeSelector = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  const formatNotePreview = (content: string, maxLength: number = 100) => {
    const cleaned = content.replace(/[#*`]/g, "").trim();
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + "..." : cleaned;
  };

  if (!isOpen) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="w-full justify-start text-left"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          {selectedNotes.length > 0
            ? `${selectedNotes.length} idea${selectedNotes.length !== 1 ? "s" : ""} selected`
            : "Add ideas from your library"}
          {selectedNotes.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {contextMode}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Ideas from Library</CardTitle>
          <Button variant="ghost" size="sm" onClick={closeSelector}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {selectedNotes.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedNotes.length}/5 selected</Badge>
              <Select
                value={contextMode}
                onValueChange={(value) => setContextMode(value as IdeaContextConfig["contextMode"])}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspiration">Inspiration</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear All
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search your notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Notes Preview */}
        {selectedNotes.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium">Selected Ideas:</div>
            <div className="flex flex-wrap gap-2">
              {selectedNotes.map((note) => (
                <Badge
                  key={note.id}
                  variant="secondary"
                  className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                  onClick={() => toggleNoteSelection(note)}
                >
                  {note.title}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
            <Separator className="mt-3" />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground ml-2 text-sm">Loading your notes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-8 text-center">
            <p className="text-destructive mb-2 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={loadNotes}>
              Try Again
            </Button>
          </div>
        )}

        {/* Notes List */}
        {!loading && !error && (
          <ScrollArea className="h-64">
            {filteredNotes.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                {searchTerm ? "No notes match your search" : "No starred notes found"}
                <p className="mt-1 text-xs">Star some notes to use them as idea context</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map((note) => {
                  const isSelected = selectedNotes.some((n) => n.id === note.id);
                  const canSelect = selectedNotes.length < 5 || isSelected;

                  return (
                    <Card
                      key={note.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : canSelect
                            ? "hover:border-primary/50"
                            : "cursor-not-allowed opacity-50"
                      }`}
                      onClick={() => canSelect && toggleNoteSelection(note)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="truncate text-sm font-medium">{note.title}</h4>
                              {note.starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                              {isSelected && <Check className="text-primary h-3 w-3" />}
                            </div>
                            <p className="text-muted-foreground mb-2 text-xs">{formatNotePreview(note.content)}</p>
                            {note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {note.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="px-1 py-0 text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {note.tags.length > 3 && (
                                  <Badge variant="outline" className="px-1 py-0 text-xs">
                                    +{note.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}

        {/* Context Mode Info */}
        {selectedNotes.length > 0 && (
          <div className="bg-muted/50 mt-4 rounded-lg p-3">
            <div className="mb-1 text-xs font-medium">Context Mode: {contextMode}</div>
            <div className="text-muted-foreground text-xs">
              {contextMode === "inspiration" && "Ideas will inspire creative direction and tone"}
              {contextMode === "reference" && "Ideas will be used as factual reference material"}
              {contextMode === "template" && "Ideas will provide structural guidance and templates"}
              {contextMode === "comprehensive" && "Ideas will provide full context and direction"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
