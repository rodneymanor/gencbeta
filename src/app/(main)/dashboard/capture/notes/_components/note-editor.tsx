import { Dispatch, SetStateAction } from "react";

import { Edit3, FileText, Save, Copy, Trash2, Hash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { HemingwayEditor } from "../../../scripts/editor/_components/hemingway-editor";

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
  setSelectedNote: Dispatch<SetStateAction<Note | null>>;
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
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800" style={{ padding: "24px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
        <div className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
            {isEditing ? "Editing Note" : selectedNote.title}
          </h2>
        </div>
        <div className="flex" style={{ gap: "8px" }}>
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex h-10 items-center gap-2 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-[0.98] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => convertToScript(selectedNote)}
                className="flex h-10 items-center gap-2 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-[0.98] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                <FileText className="h-4 w-4" />
                Convert to Script
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="h-10 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-[0.98] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="flex h-10 items-center gap-2 rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {isEditing ? (
          <>
            <Input
              value={selectedNote.title}
              onChange={(e) => setSelectedNote((prev) => (prev ? { ...prev, title: e.target.value } : null))}
              className="text-lg font-semibold"
              placeholder="Note title..."
            />

            <div className="min-h-[400px]">
              <HemingwayEditor
                value={selectedNote.content}
                onChange={(value) => setSelectedNote((prev) => (prev ? { ...prev, content: value } : null))}
                placeholder="Start writing your note... Use the rich editor with readability analysis."
                minRows={10}
                maxRows={30}
                autoFocus={true}
              />
            </div>
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
        <div className="flex" style={{ gap: "8px" }}>
          <button className="flex h-10 items-center gap-2 rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 active:scale-[0.98]">
            <FileText className="h-4 w-4" />
            Convert to Script
          </button>
          <button className="flex h-10 items-center gap-2 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-[0.98] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button className="flex h-10 items-center gap-2 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-red-600 transition-all duration-200 ease-in-out hover:bg-red-50 active:scale-[0.98] dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/20">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
