"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MinimalEnhancedEditor } from "./_components/layout/minimal-enhanced-editor";

export default function ScriptEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [script, setScript] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load script from various sources
    const loadScript = () => {
      try {
        // 1. Check URL params for script content
        const urlScript = searchParams.get("script");
        if (urlScript) {
          setScript(decodeURIComponent(urlScript));
          setIsLoading(false);
          return;
        }

        // 2. Check sessionStorage for speed write results
        const speedWriteResults = sessionStorage.getItem("speedWriteResults");
        if (speedWriteResults) {
          const parsed = JSON.parse(speedWriteResults);
          if (parsed.selectedScript) {
            setScript(parsed.selectedScript);
            setIsLoading(false);
            return;
          }
        }

        // 3. Check localStorage for draft
        const draft = localStorage.getItem("scriptDraft");
        if (draft) {
          setScript(draft);
          setIsLoading(false);
          return;
        }

        // 4. Default empty state
        setScript("");
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading script:", error);
        setScript("");
        setIsLoading(false);
      }
    };

    loadScript();
  }, [searchParams]);

  const handleScriptChange = (newScript: string) => {
    setScript(newScript);
    // Auto-save to localStorage
    localStorage.setItem("scriptDraft", newScript);
  };

  const handleScriptSave = (scriptToSave: string) => {
    // TODO: Implement actual save functionality
    console.log("Saving script:", scriptToSave);
    
    // For now, just update localStorage
    localStorage.setItem("scriptDraft", scriptToSave);
    
    // Show success message or redirect
    // router.push("/dashboard/scripts");
  };

  if (isLoading) {
    return (
      <div className="center-column">
        <div className="section">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading editor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MinimalEnhancedEditor 
      initialText={script} 
      onTextChange={handleScriptChange} 
      onSave={handleScriptSave} 
    />
  );
}
