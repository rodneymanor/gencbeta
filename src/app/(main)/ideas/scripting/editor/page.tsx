"use client";

import { useState } from "react";

import { Save, Eye, Bold, Italic, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ScriptEditorPage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Untitled Script");

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 p-4">
          <div className="mb-4 border-b p-2">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Italic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full resize-none"
            placeholder="Start writing your script..."
          />
        </div>

        <div className="w-80 border-l p-4">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <p className="text-muted-foreground text-sm">AI suggestions will appear here...</p>
        </div>
      </div>
    </div>
  );
}
