"use client";

import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

import { HookBlock, BridgeBlock, GoldenNuggetBlock, CTABlock } from "./script-blocks";
import { BunnyVideoBlock } from "./video-block";

// Create enhanced schema with all custom blocks
export const customBlockSchema = BlockNoteSchema.create({
  blockSpecs: {
    // Keep all default blocks (paragraph, heading, bulletListItem, etc.)
    ...defaultBlockSpecs,

    // Add existing script blocks
    hook: HookBlock,
    bridge: BridgeBlock,
    goldenNugget: GoldenNuggetBlock,
    cta: CTABlock,

    // Add new video block
    bunnyVideo: BunnyVideoBlock,
  },
});

// Export the schema type for use in components
export type CustomBlockSchema = typeof customBlockSchema;
