"use client";

import { Bot, User } from "lucide-react";

import { ChatMessage } from "./types";

interface ChatHistoryProps {
  chatHistory: ChatMessage[];
  isGenerating: boolean;
}

export function ChatHistory({ chatHistory, isGenerating }: ChatHistoryProps) {
  return (
    <div className="max-h-96 flex-1 space-y-4 overflow-y-auto">
      {chatHistory.map((message) => (
        <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex max-w-[80%] gap-2 ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                message.type === "user" ? "bg-primary" : "bg-muted"
              }`}
            >
              {message.type === "user" ? (
                <User className="text-primary-foreground h-4 w-4" />
              ) : (
                <Bot className="text-muted-foreground h-4 w-4" />
              )}
            </div>
            <div
              className={`rounded-lg p-3 ${
                message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        </div>
      ))}
      {isGenerating && (
        <div className="flex justify-start gap-3">
          <div className="flex gap-2">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
              <Bot className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">Generating your scripts...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
