"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { HemingwayEditor } from "../../scripts/editor/_components/hemingway-editor";
import { ContextualActionMenu } from "@/components/ui/contextual-action-menu";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { useContextualMenu } from "@/hooks/use-contextual-menu";
import { type ContextualAction, type ContentElement, type DropdownOption } from "@/lib/contextual-actions";
import { toast } from "sonner";

export default function NotesCapturePage() {
  const [content, setContent] = useState("");
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");

  // Contextual menu
  const { menuState, hideMenu, handleTextSelection, handleAction: baseHandleAction } = useContextualMenu();

  // Configure top bar
  const { setTopBarConfig } = useTopBarConfig();

  useEffect(() => {
    setTopBarConfig({
      title: "Note Editor",
      showTitle: true,
      titlePosition: "left",
    });
  }, [setTopBarConfig]);

  // Load note content if noteId is provided
  useEffect(() => {
    if (noteId) {
      // TODO: Load note content from API
      console.log("Loading note:", noteId);
    }
  }, [noteId]);

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

  return (
    <div className="h-full w-full" onMouseUp={handleTextSelection}>
      <HemingwayEditor value={content} onChange={setContent} placeholder="Start writing your note..." autoFocus />

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
