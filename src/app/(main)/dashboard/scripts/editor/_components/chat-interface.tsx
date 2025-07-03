"use client";

import { useState, useRef, useEffect } from "react";

import { MessageCircle, Send, Loader2, FileText, Sparkles, Lightbulb, Copy, Check, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatInterfaceProps {
  onScriptGenerated: (script: string) => void;
  currentScript: string;
  className?: string;
}

export function ChatInterface({ onScriptGenerated, currentScript, className = "" }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hi! I'm your AI script assistant. I can help you:\n\n• Convert notes into scripts\n• Improve existing scripts\n• Generate hooks, bridges, and CTAs\n• Analyze script structure\n\nWhat would you like to work on today?",
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual API call)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: await generateAIResponse(userMessage.content),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to generate AI response:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI response (mock implementation)
  const generateAIResponse = async (userInput: string): Promise<string> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simple pattern matching for demo
    const input = userInput.toLowerCase();

    if (input.includes("convert") || input.includes("notes")) {
      return `I'll help you convert your notes into a script. Here's a structured approach:

**Hook:** Start with an attention-grabbing opening
**Bridge:** Connect to your main point
**Golden Nugget:** Share your key insight or value
**Call-to-Action:** End with a clear next step

Would you like me to create a script based on specific notes you have?`;
    }

    if (input.includes("improve") || input.includes("better")) {
      return `I can help improve your script! Here are some suggestions:

• **Strengthen your hook** - Make the opening more compelling
• **Add bridges** - Improve transitions between ideas  
• **Enhance golden nuggets** - Make insights more valuable
• **Optimize CTAs** - Make calls-to-action more compelling

Share your script and I'll provide specific improvements!`;
    }

    if (input.includes("hook")) {
      return `Great hooks grab attention immediately! Here are some proven patterns:

• **Question hooks:** &ldquo;What if I told you...&rdquo;
• **Statistic hooks:** &ldquo;95% of people don't know...&rdquo;
• **Story hooks:** &ldquo;Last week, something crazy happened...&rdquo;
• **Contradiction hooks:** &ldquo;Everyone thinks X, but actually...&rdquo;

What's your script about? I'll help you craft the perfect hook!`;
    }

    if (input.includes("script") && input.includes("about")) {
      return `I'd love to help you create a script! To give you the best assistance, could you tell me:

• What's the main topic or message?
• Who's your target audience?
• What action do you want them to take?
• How long should the script be?

With these details, I can create a compelling script structure for you!`;
    }

    return `I understand you're looking for help with script writing. I can assist with:

• **Script structure** - Organizing your ideas effectively
• **Content improvement** - Making your message more compelling  
• **Element optimization** - Perfecting hooks, bridges, and CTAs
• **Notes conversion** - Turning raw ideas into polished scripts

What specific aspect would you like to focus on?`;
  };

  // Handle copy to clipboard
  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Handle use as script
  const handleUseAsScript = (content: string) => {
    onScriptGenerated(content);
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        type: "assistant",
        content: "Chat cleared! How can I help you with your script today?",
        timestamp: new Date(),
      },
    ]);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-muted-foreground h-5 w-5" />
          <h2 className="text-lg font-semibold">AI Script Assistant</h2>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="mr-1 h-3 w-3" />
            Beta
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                {message.type === "assistant" && (
                  <div className="border-muted-foreground/20 mt-2 flex items-center gap-1 border-t pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      className="h-6 px-2 text-xs"
                    >
                      {copiedMessageId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseAsScript(message.content)}
                      className="h-6 px-2 text-xs"
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      Use as Script
                    </Button>
                  </div>
                )}

                <div className="text-muted-foreground mt-1 text-xs">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted max-w-[80%] rounded-lg p-3">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your script... (⌘+Enter to send)"
              className="min-h-[60px] resize-none"
              rows={2}
            />
          </div>
          <Button type="submit" disabled={!inputValue.trim() || isLoading} className="self-end">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
          <Lightbulb className="h-3 w-3" />
          <span>Try: &ldquo;Convert my notes to a script&rdquo; or &ldquo;Improve my hook&rdquo;</span>
        </div>
      </div>
    </div>
  );
}
