"use client";

import { useState, useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { ChevronLeft } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      breadcrumb: (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/dashboard/notes")}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Notes
          </Button>
        </div>
      ),
    });
  }, [setTopBarConfig, noteId]);

  // Load note content if noteId is provided
  useEffect(() => {
    console.log("📝 [NewNotePage] noteId from URL params:", noteId);
    console.log("📝 [NewNotePage] user state:", !!user);
    if (noteId && user) {
      console.log("📝 [NewNotePage] Calling loadNote with:", noteId);
      loadNote(noteId);
    }
  }, [noteId, user]);

  const loadNote = async (id: string) => {
    console.log("🚀 [NewNotePage] loadNote function called with ID:", id);
    console.log("🚀 [NewNotePage] Current user state:", !!user);

    if (!user) {
      console.error("🚀 [NewNotePage] No user found, aborting load");
      toast.error("Please log in to load notes");
      return;
    }

    try {
      console.log("🚀 [NewNotePage] Getting Firebase token...");
      const token = await user.getIdToken();

      // NEW API ENDPOINT - Using /api/notes/[id]
      const apiUrl = `/api/notes/${id}`;
      console.log("🚀 [NewNotePage] Making GET request to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🚀 [NewNotePage] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🚀 [NewNotePage] Error response body:", errorText);
        throw new Error(`Failed to load note: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🚀 [NewNotePage] Successfully loaded note data:", data);

      if (data && data.note) {
        console.log("🚀 [NewNotePage] Setting note data in UI");
        console.log("🚀 [NewNotePage] Note title:", data.note.title);
        console.log("🚀 [NewNotePage] Note content length:", data.note.content?.length || 0);
        console.log("🚀 [NewNotePage] Note content preview:", data.note.content?.substring(0, 200));
        console.log("🚀 [NewNotePage] Note tags:", data.note.tags);

        setTitle(data.note.title || "");
        setContent(data.note.content || "");
        setNoteMetadata(data.note);

        // Check for YouTube transcript
        if (data.note.tags && data.note.tags.includes("youtube")) {
          toast.info("YouTube transcript loaded");
        }

        toast.success("Note loaded successfully");
      } else {
        console.error("🚀 [NewNotePage] No note data in response:", data);
        throw new Error("Note data not found in response");
      }
    } catch (error) {
      console.error("🚀 [NewNotePage] CRITICAL ERROR loading note:", error);
      toast.error(`Failed to load note: ${error instanceof Error ? error.message : "Unknown error"}`);
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
    if (!noteMetadata || !noteMetadata.metadata || !noteMetadata.tags?.includes("youtube")) {
      return null;
    }

    const { channelName, videoUrl, duration, viewCount, publishedAt } = noteMetadata.metadata;

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
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {viewCount && <span>{viewCount.toLocaleString()} views</span>}
                {publishedAt && <span>{new Date(publishedAt).toLocaleDateString()}</span>}
              </div>
              {videoUrl && (
                <a
                  href={videoUrl}
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

  // Debug state values
  useEffect(() => {
    console.log("🎯 [NewNotePage] Current state values:", {
      title,
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      hasContent: !!content,
      noteId,
    });
  }, [content, title, noteId]);

  return (
    <div className="h-full w-full" onMouseUp={handleTextSelection}>
      {renderYouTubeMetadata()}

      <HemingwayEditor
        value={content}
        onChange={setContent}
        placeholder={noteId ? "Edit your note..." : "Start writing your note..."}
        title={title}
        onTitleChange={handleTitleChange}
        showTitleEditor={false}
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
