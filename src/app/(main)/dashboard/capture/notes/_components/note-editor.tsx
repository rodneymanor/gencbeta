import { Edit3, FileText, Save, Copy, Trash2, Hash, Bold, Italic, List, Quote, Link } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  starred: boolean;
}

interface NoteEditorProps {
  selectedNote: Note | null;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  setSelectedNote: (note: Note | null) => void;
  saveNote: () => void;
  convertToScript: (note: Note) => void;
  getTagColor: (tagName: string) => string;
}

export function NoteEditor({
  selectedNote,
  isEditing,
  setIsEditing,
  setSelectedNote,
  saveNote,
  convertToScript,
  getTagColor,
}: NoteEditorProps) {
  if (!selectedNote) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            {isEditing ? "Editing Note" : selectedNote.title}
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => convertToScript(selectedNote)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Convert to Script
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveNote} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <Input
              value={selectedNote.title}
              onChange={(e) => setSelectedNote((prev) => (prev ? { ...prev, title: e.target.value } : null))}
              className="text-lg font-semibold"
              placeholder="Note title..."
            />

            {/* Markdown Toolbar */}
            <div className="flex gap-1 border-b pb-2">
              <Button variant="ghost" size="sm">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Quote className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Link className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              value={selectedNote.content}
              onChange={(e) => setSelectedNote((prev) => (prev ? { ...prev, content: e.target.value } : null))}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Start writing your note... You can use Markdown formatting."
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{selectedNote.content}</div>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span className="text-sm font-medium">Tags:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedNote.tags.map((tag) => (
              <Badge key={tag} className={`text-xs ${getTagColor(tag)} text-white`}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            Convert to Script
          </Button>
          <Button variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" className="text-destructive gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
