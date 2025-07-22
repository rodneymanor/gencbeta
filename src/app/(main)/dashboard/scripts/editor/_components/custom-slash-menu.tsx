"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core";
import { getDefaultReactSlashMenuItems, SuggestionMenuController } from "@blocknote/react";
import { Zap, ArrowRight, Lightbulb, Target, Video, Play } from "lucide-react";

// Create custom slash menu items for our blocks
export const createCustomSlashMenuItems = (editor: BlockNoteEditor<any, any, any>) => [
  // Script Structure Items
  {
    title: "Hook",
    onItemClick: () => {
      editor.insertBlocks(
        [
          {
            type: "hook",
            props: {
              text: "Add your hook here...",
            },
          },
        ],
        editor.getTextCursorPosition().block,
        "after",
      );
    },
    aliases: ["hook", "opening", "attention", "start"],
    group: "Script Structure",
    icon: <Zap className="h-4 w-4" />,
    subtext: "Attention-grabbing opening",
  },
  {
    title: "Bridge",
    onItemClick: () => {
      editor.insertBlocks(
        [
          {
            type: "bridge",
            props: {
              text: "Add your bridge here...",
            },
          },
        ],
        editor.getTextCursorPosition().block,
        "after",
      );
    },
    aliases: ["bridge", "transition", "connect"],
    group: "Script Structure",
    icon: <ArrowRight className="h-4 w-4" />,
    subtext: "Connect hook to main content",
  },
  {
    title: "Golden Nugget",
    onItemClick: () => {
      editor.insertBlocks(
        [
          {
            type: "goldenNugget",
            props: {
              text: "Add your golden nugget here...",
            },
          },
        ],
        editor.getTextCursorPosition().block,
        "after",
      );
    },
    aliases: ["golden", "nugget", "main", "core", "value"],
    group: "Script Structure",
    icon: <Lightbulb className="h-4 w-4" />,
    subtext: "Main value or key insight",
  },
  {
    title: "Call to Action",
    onItemClick: () => {
      editor.insertBlocks(
        [
          {
            type: "cta",
            props: {
              text: "Add your call-to-action here...",
            },
          },
        ],
        editor.getTextCursorPosition().block,
        "after",
      );
    },
    aliases: ["cta", "call", "action", "ending", "close"],
    group: "Script Structure",
    icon: <Target className="h-4 w-4" />,
    subtext: "Drive action or next steps",
  },

  // Media Items
  {
    title: "Bunny Video",
    onItemClick: () => {
      editor.insertBlocks(
        [
          {
            type: "bunnyVideo",
            props: {
              videoId: "",
              libraryId: "",
              autoplay: false,
              muted: false,
              loop: false,
              preload: true,
              responsive: true,
              caption: "",
            },
          },
        ],
        editor.getTextCursorPosition().block,
        "after",
      );
    },
    aliases: ["bunny", "video", "stream", "embed", "media"],
    group: "Media",
    icon: <Video className="h-4 w-4" />,
    subtext: "Embed Bunny.net hosted video",
  },
];

// Custom Slash Menu Controller Component
export function CustomSlashMenuController({ editor }: { editor: BlockNoteEditor<any, any, any> }) {
  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) => {
        const defaultItems = getDefaultReactSlashMenuItems(editor);
        const customItems = createCustomSlashMenuItems(editor);

        return filterSuggestionItems([...defaultItems, ...customItems], query);
      }}
    />
  );
}
