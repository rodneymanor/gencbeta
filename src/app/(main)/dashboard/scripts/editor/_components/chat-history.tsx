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
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
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
        return <User className="text-primary-foreground h-4 w-4" />;
      case "ai":
        return <Bot className="text-muted-foreground h-4 w-4" />;
      case "system":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="text-destructive h-4 w-4" />;
      default:
        return <Bot className="text-muted-foreground h-4 w-4" />;
    }
  };

  const getMessageStyles = (type: ChatMessage["type"]) => {
    switch (type) {
      case "user":
        return {
          container: "justify-end",
          wrapper: "flex-row-reverse",
          avatar: "bg-primary",
          bubble: "bg-primary text-primary-foreground",
        };
      case "ai":
        return {
          container: "justify-start",
          wrapper: "flex-row",
          avatar: "bg-muted",
          bubble: "bg-muted",
        };
      case "system":
        return {
          container: "justify-start",
          wrapper: "flex-row",
          avatar: "bg-green-100 dark:bg-green-900",
          bubble: "bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700",
        };
      case "error":
        return {
          container: "justify-start",
          wrapper: "flex-row",
          avatar: "bg-destructive/10",
          bubble: "bg-destructive/5 border border-destructive/20",
        };
      default:
        return {
          container: "justify-start",
          wrapper: "flex-row",
          avatar: "bg-muted",
          bubble: "bg-muted",
        };
    }
  };

  return (
    <div className="h-full space-y-4 overflow-y-auto">
      {messages.map((message, index) => {
        const styles = getMessageStyles(message.type);
        const icon = getMessageIcon(message.type);

        // Use expandable text for user messages (especially the first one which contains the initial idea)
        const isInitialUserMessage = message.type === "user" && index === 0;

        return (
          <div key={message.id} className={`flex gap-3 ${styles.container}`}>
            <div className={`flex max-w-[85%] gap-2 ${styles.wrapper}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${styles.avatar}`}>{icon}</div>
              <div className={`rounded-lg p-3 ${styles.bubble}`}>
                {isInitialUserMessage ? (
                  <ExpandableText content={message.content} maxLines={3} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                {message.metadata?.videoUrl && (
                  <p className="text-muted-foreground mt-2 truncate text-xs">Video: {message.metadata.videoUrl}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
