"use client";

import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { Zap, ArrowRight, Lightbulb, Target } from "lucide-react";

// Hook Block
export const HookBlock = createReactBlockSpec(
  {
    type: "hook",
    propSchema: {
      ...defaultProps,
      text: {
        default: "Add your hook here...",
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      return (
        <div className="my-4 rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Hook</span>
          </div>
          <div className="text-gray-700">{props.children}</div>
        </div>
      );
    },
  },
);

// Bridge Block
export const BridgeBlock = createReactBlockSpec(
  {
    type: "bridge",
    propSchema: {
      ...defaultProps,
      text: {
        default: "Add your bridge here...",
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      return (
        <div className="my-4 rounded-lg border-l-4 border-cyan-400 bg-cyan-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-800">Bridge</span>
          </div>
          <div className="text-gray-700">{props.children}</div>
        </div>
      );
    },
  },
);

// Golden Nugget Block
export const GoldenNuggetBlock = createReactBlockSpec(
  {
    type: "golden-nugget",
    propSchema: {
      ...defaultProps,
      text: {
        default: "Add your golden nugget here...",
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      return (
        <div className="my-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Golden Nugget</span>
          </div>
          <div className="text-gray-700">{props.children}</div>
        </div>
      );
    },
  },
);

// CTA Block
export const CTABlock = createReactBlockSpec(
  {
    type: "cta",
    propSchema: {
      ...defaultProps,
      text: {
        default: "Add your call-to-action here...",
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      return (
        <div className="my-4 rounded-lg border-l-4 border-green-400 bg-green-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Call to Action</span>
          </div>
          <div className="text-gray-700">{props.children}</div>
        </div>
      );
    },
  },
);
