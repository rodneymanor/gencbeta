"use client";

import { useState, useEffect } from "react";

import { useTopBarConfig } from "@/hooks/use-route-topbar";

import { HemingwayEditor } from "../../scripts/editor/_components/hemingway-editor";

export default function NewCapturePage() {
  const [content, setContent] = useState("");

  // Configure top bar
  const { setTopBarConfig } = useTopBarConfig();

  useEffect(() => {
    setTopBarConfig({
      title: "New Capture",
      showTitle: true,
      titlePosition: "left",
    });
  }, [setTopBarConfig]);

  return (
    <div className="h-full w-full">
      <HemingwayEditor value={content} onChange={setContent} placeholder="Start capturing your ideas..." autoFocus />
    </div>
  );
}
