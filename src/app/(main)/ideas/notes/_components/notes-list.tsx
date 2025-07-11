import { Star, Calendar, Mic, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { type Note } from "./notes-data";

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  getTagColor: (tagName: string) => string;
}

export function NotesList({ notes, selectedNote, onSelectNote, getTagColor }: NotesListProps) {
  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <Card
          key={note.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedNote?.id === note.id ? "ring-primary ring-2" : ""
          }`}
          onClick={() => onSelectNote(note)}
        >
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {note.type === "voice" ? (
                    <Mic className="text-primary h-4 w-4 flex-shrink-0" />
                  ) : (
                    <FileText className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                  )}
                  <h3 className="line-clamp-1 font-medium">{note.title}</h3>
                </div>
                {note.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
              </div>

              <p className="text-muted-foreground line-clamp-2 text-sm">
                {note.type === "voice"
                  ? `Voice note • ${note.duration ? Math.floor(note.duration / 60) : 0}:${((note.duration ?? 0) % 60).toString().padStart(2, "0")}`
                  : `${note.content.replace(/[#*>`-]/g, "").substring(0, 100)}...`}
              </p>

              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className={`text-xs ${getTagColor(tag)} text-white`}>
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{note.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3" />
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
