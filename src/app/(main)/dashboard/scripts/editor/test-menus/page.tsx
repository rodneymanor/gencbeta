"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import all the contextual menu components
import { AIInputPanel } from "../_components/ai-input-panel";
import { AIMenuBar } from "../_components/ai-menu-bar";
import { ContextualActionMenu } from "../_components/contextual-action-menu";
import { ContextualMenu } from "../_components/layout/contextual-menu";

export default function TestMenusPage() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 300, y: 200 });

  // Sample script element for testing
  const sampleElement = {
    type: "golden-nugget" as const,
    text: "This is a sample golden nugget text for testing the contextual menus",
    startIndex: 0,
    endIndex: 63,
    confidence: 0.85,
    suggestions: ["Make it more actionable", "Add supporting data"],
  };

  const handleMenuClick = (menuType: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.right + 20,
      y: rect.top,
    });
    setActiveMenu(menuType);
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  const handleAction = (actionType: string, customPrompt?: string, option?: string) => {
    console.log("Action triggered:", { actionType, customPrompt, option });
    alert(`Action: ${actionType}${option ? ` (${option})` : ""}${customPrompt ? ` - "${customPrompt}"` : ""}`);
  };

  const handleTextUpdate = (newText: string) => {
    console.log("Text update:", newText);
    alert(`Text updated to: "${newText}"`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Contextual Menu Test Page</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Menu Option 1: ContextualActionMenu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              ContextualActionMenu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              From: <code>contextual-action-menu.tsx</code>
            </p>
            <p className="mb-4 text-sm">
              Shows element type badge, confidence, selected text, suggestions, and AI actions with dropdown options.
            </p>
            <Button onClick={(e) => handleMenuClick("contextual-action-menu", e)} variant="outline">
              Show ContextualActionMenu
            </Button>
          </CardContent>
        </Card>

        {/* Menu Option 2: ContextualMenu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              ContextualMenu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              From: <code>layout/contextual-menu.tsx</code>
            </p>
            <p className="mb-4 text-sm">
              Simple menu with element type, quick actions (enhance, analyze, alternatives), and general actions (copy,
              edit, delete).
            </p>
            <Button onClick={(e) => handleMenuClick("contextual-menu", e)} variant="outline">
              Show ContextualMenu
            </Button>
          </CardContent>
        </Card>

        {/* Menu Option 3: AIInputPanel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              AIInputPanel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              From: <code>ai-input-panel.tsx</code>
            </p>
            <p className="mb-4 text-sm">
              Input field for "Ask AI to do something...", Universal Actions (Humanize, Shorten, Change Tone), and
              component-specific actions.
            </p>
            <Button onClick={(e) => handleMenuClick("ai-input-panel", e)} variant="outline">
              Show AIInputPanel
            </Button>
          </CardContent>
        </Card>

        {/* Menu Option 4: AIMenuBar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">4</Badge>
              AIMenuBar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              From: <code>ai-menu-bar.tsx</code>
            </p>
            <p className="mb-4 text-sm">
              Custom AI instruction textarea, Quick Actions dropdown with Universal Actions and element-specific
              actions.
            </p>
            <Button onClick={(e) => handleMenuClick("ai-menu-bar", e)} variant="outline">
              Show AIMenuBar
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/20 rounded-lg p-6">
        <h2 className="mb-4 text-xl font-semibold">Sample Element for Testing</h2>
        <div className="bg-background rounded border p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="bg-script-golden-nugget text-script-golden-nugget-foreground">Golden Nugget</Badge>
            <Badge variant="outline" className="text-green-600">
              85% confidence
            </Badge>
          </div>
          <p className="text-sm">"{sampleElement.text}"</p>
        </div>
      </div>

      {/* Currently Active Menu Display */}
      {activeMenu && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="w-64">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Currently Showing:</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{activeMenu}</Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Render Active Menus */}
      {activeMenu === "contextual-action-menu" && (
        <ContextualActionMenu
          element={sampleElement}
          position={menuPosition}
          onAction={handleAction}
          onClose={closeMenu}
        />
      )}

      {activeMenu === "contextual-menu" && (
        <ContextualMenu
          elementType="golden-nugget"
          elementText={sampleElement.text}
          position={menuPosition}
          onClose={closeMenu}
          onAction={handleAction}
          isVisible={true}
        />
      )}

      {activeMenu === "ai-input-panel" && (
        <AIInputPanel
          element={sampleElement}
          position={menuPosition}
          onAction={handleAction}
          onTextUpdate={handleTextUpdate}
          onClose={closeMenu}
        />
      )}

      {activeMenu === "ai-menu-bar" && (
        <AIMenuBar element={sampleElement} position={menuPosition} onAction={handleAction} onClose={closeMenu} />
      )}
    </div>
  );
}
