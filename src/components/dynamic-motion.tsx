"use client";

import { ComponentProps } from "react";

import dynamic from "next/dynamic";

// Dynamically import framer-motion components to reduce initial bundle size
export const MotionDiv = dynamic(() => import("framer-motion").then((mod) => mod.motion.div), {
  ssr: false,
  loading: () => <div />, // Fallback while loading
});

export const AnimatePresence = dynamic(() => import("framer-motion").then((mod) => mod.AnimatePresence), {
  ssr: false,
  loading: () => null, // Fallback while loading
});

// Type-safe props
export type MotionDivProps = ComponentProps<typeof MotionDiv>;
export type AnimatePresenceProps = ComponentProps<typeof AnimatePresence>;
