import { useState, useCallback, useRef } from "react";

import {
  type ContentElement,
  type ContextualAction,
  type DropdownOption,
  detectNoteElementType,
} from "@/lib/contextual-actions";

interface ContextualMenuState {
  element: ContentElement | null;
  position: { x: number; y: number } | null;
  isVisible: boolean;
}

export function useContextualMenu() {
  const [menuState, setMenuState] = useState<ContextualMenuState>({
    element: null,
    position: null,
    isVisible: false,
  });

  const showMenu = useCallback((element: ContentElement, position: { x: number; y: number }) => {
    setMenuState({
      element,
      position,
      isVisible: true,
    });
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const handleTextSelection = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        return;
      }

      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Get the element that contains the selection
      const container = range.commonAncestorContainer;
      const parentElement =
        container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);

      // Detect element type for notes
      const elementType = detectNoteElementType(selectedText, parentElement?.tagName);

      const element: ContentElement = {
        id: `${Date.now()}-${Math.random()}`,
        type: elementType,
        text: selectedText,
        metadata: {
          tagName: parentElement?.tagName,
          className: parentElement?.className,
        },
      };

      // Position menu at the end of selection
      showMenu(element, {
        x: rect.right,
        y: rect.bottom + 10,
      });
    },
    [showMenu],
  );

  const handleElementClick = useCallback(
    (element: ContentElement, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      showMenu(element, {
        x: event.clientX,
        y: event.clientY,
      });
    },
    [showMenu],
  );

  const handleAction = useCallback(
    async (
      action: ContextualAction,
      element: ContentElement,
      dropdownOption?: DropdownOption,
      onActionComplete?: (result: any) => void,
    ) => {
      console.log("Contextual action:", action, "on element:", element);
      if (dropdownOption) {
        console.log("Dropdown option:", dropdownOption);
      }

      // Hide menu immediately
      hideMenu();

      // TODO: Implement actual action handlers
      // This is where you would call your AI services
      try {
        let result;

        switch (action.type) {
          case "edit":
            // Open inline editor
            break;
          case "humanize":
            // Call AI humanization service
            break;
          case "improve":
            // Call AI improvement service
            break;
          case "transform":
            // Call transformation service
            break;
          case "expand":
            // Call expansion service
            break;
          case "enhance":
            // Call enhancement service
            break;
          default:
            console.warn("Unknown action type:", action.type);
        }

        if (onActionComplete && result) {
          onActionComplete(result);
        }
      } catch (error) {
        console.error("Error executing action:", error);
      }
    },
    [hideMenu],
  );

  return {
    menuState,
    showMenu,
    hideMenu,
    handleTextSelection,
    handleElementClick,
    handleAction,
  };
}
