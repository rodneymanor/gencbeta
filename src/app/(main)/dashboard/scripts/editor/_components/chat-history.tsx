"use client";

import { useState } from "react";

import { Bot, User, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

import { ChatMessage } from "./types";

interface ChatHistoryProps {
  messages: ChatMessage[];
}

interface ExpandableTextProps {
  content: string;
  maxLines?: number;
  className?: string;
}

function ExpandableText({ content, maxLines = 4, className = "" }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if content is long enough to warrant truncation
  const lines = content.split("\n");
  const needsTruncation = lines.length > maxLines || content.length > 300;

  if (!needsTruncation) {
    return <p className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>{content}</p>;
  }

  const truncatedContent = isExpanded
    ? content
    : lines.slice(0, maxLines).join("\n") + (lines.length > maxLines ? "..." : "");

  return (
    <div className="space-y-2">
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>{truncatedContent}</p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs transition-colors opacity-70 hover:opacity-100"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Show more
          </>
        )}
      </button>
    </div>
  );
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  const getMessageIcon = (type: ChatMessage["type"]) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4 text-white" />;
      case "ai":
        return <Bot className="h-4 w-4 text-white" />;
      case "system":
        return <CheckCircle className="h-4 w-4 text-white" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-white" />;
      default:
        return <Bot className="h-4 w-4 text-white" />;
    }
  };

  const getMessageStyles = (type: ChatMessage["type"]) => {
    switch (type) {
      case "user":
        return {
          avatar: "bg-blue-500",
          bubble: "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800",
          text: "text-blue-900 dark:text-blue-100",
        };
      case "ai":
        return {
          avatar: "bg-gray-500",
          bubble: "bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800",
          text: "text-gray-900 dark:text-gray-100",
        };
      case "system":
        return {
          avatar: "bg-green-500",
          bubble: "bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800",
          text: "text-green-900 dark:text-green-100",
        };
      case "error":
        return {
          avatar: "bg-red-500",
          bubble: "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800",
          text: "text-red-900 dark:text-red-100",
        };
      default:
        return {
          avatar: "bg-gray-500",
          bubble: "bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800",
          text: "text-gray-900 dark:text-gray-100",
        };
    }
  };

  return (
    <div className="h-full space-y-3 overflow-y-auto">
      {messages.map((message, index) => {
        const styles = getMessageStyles(message.type);
        const icon = getMessageIcon(message.type);

        // Use expandable text for user messages (especially the first one which contains the initial idea)
        const isInitialUserMessage = message.type === "user" && index === 0;

        return (
          <div key={message.id} className="flex gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.avatar}`}>
              {icon}
            </div>
            <div className={`flex-1 rounded-2xl p-3 ${styles.bubble}`}>
              {isInitialUserMessage ? (
                <ExpandableText content={message.content} maxLines={3} className={styles.text} />
              ) : (
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${styles.text}`}>{message.content}</p>
              )}
              {message.metadata?.videoUrl && (
                <p className="text-muted-foreground mt-2 truncate text-xs">Video: {message.metadata.videoUrl}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
