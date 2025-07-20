"use client";

import { useState, useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ContextualActionMenu } from "@/components/ui/contextual-action-menu";
import { useContextualMenu } from "@/hooks/use-contextual-menu";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { type ContextualAction, type ContentElement, type DropdownOption } from "@/lib/contextual-actions";
import { auth } from "@/lib/firebase";

import { HemingwayEditor } from "../../../scripts/editor/_components/hemingway-editor";

export default function NewNotePage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [noteMetadata, setNoteMetadata] = useState<any>(null);
  const [user] = useAuthState(auth);
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");

  // Contextual menu
  const { menuState, hideMenu, handleTextSelection, handleAction: baseHandleAction } = useContextualMenu();

  // Configure top bar
  const { setTopBarConfig } = useTopBarConfig();

  useEffect(() => {
    setTopBarConfig({
      title: noteId ? "Edit Note" : "New Note",
      showTitle: true,
      titlePosition: "left",
    });
  }, [setTopBarConfig, noteId]);

  // Load note content if noteId is provided
  useEffect(() => {
    if (noteId) {
      loadNote(noteId);
    }
  }, [noteId]);

  const loadNote = async (id: string) => {
    if (!user) {
      toast.error("Please log in to load notes");
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/chrome-extension/notes?noteId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load note");
      }

      const data = await response.json();
      if (data.success && data.note) {
        setTitle(data.note.title);
        setContent(data.note.content);
        setNoteMetadata(data.note);

        // If it's a YouTube transcript note, show a toast with video info
        if (data.note.type === "youtube" && data.note.metadata?.channelName) {
          toast.info(`YouTube transcript from ${data.note.metadata.channelName}`);
        }
      } else {
        throw new Error(data.error || "Failed to load note");
      }
    } catch (error) {
      console.error("Error loading note:", error);
      toast.error("Failed to load note");
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // TODO: Auto-save title or save when content is saved
    console.log("Title changed to:", newTitle);
  };

  // Handle contextual menu actions
  const handleContextualAction = async (
    action: ContextualAction,
    element: ContentElement,
    dropdownOption?: DropdownOption,
  ) => {
    // Log the action for now
    console.log("Note action:", action, element, dropdownOption);

    // Show toast for demonstration
    toast.info(`Action: ${action.label} on ${element.type}`);

    // Handle the action
    await baseHandleAction(action, element, dropdownOption, (result) => {
      // Handle the result - update content, etc.
      console.log("Action result:", result);
    });
  };

  // Render YouTube metadata card for YouTube transcript notes
  const renderYouTubeMetadata = () => {
    if (!noteMetadata || noteMetadata.type !== "youtube" || !noteMetadata.metadata) {
      return null;
    }

    const { channelName, videoId, duration } = noteMetadata.metadata;
    const youtubeUrl = noteMetadata.url;

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  YouTube Transcript
                </Badge>
                {channelName && <span className="text-sm text-gray-600">by {channelName}</span>}
              </div>
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline hover:text-blue-800"
                >
                  View original video →
                </a>
              )}
            </div>
            {duration && (
              <span className="text-sm text-gray-500">
                {Math.floor(duration / 60)}m {duration % 60}s
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full w-full" onMouseUp={handleTextSelection}>
      {renderYouTubeMetadata()}

      <HemingwayEditor
        value={content}
        onChange={setContent}
        placeholder={noteId ? "Edit your note..." : "Start writing your note..."}
        title={title}
        onTitleChange={handleTitleChange}
        showTitleEditor={true}
        autoFocus
      />

      {/* Contextual Menu for Notes */}
      {menuState.isVisible && menuState.element && menuState.position && (
        <ContextualActionMenu
          element={menuState.element}
          position={menuState.position}
          onAction={handleContextualAction}
          onClose={hideMenu}
          contentType="note"
          showConfidence={false}
          title="Note Actions"
        />
      )}
    </div>
  );
}
