import { useState } from "react";

import { Zap, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HeroSectionProps {
  userName?: string;
}

export default function HeroSection({ userName = "Creator" }: HeroSectionProps) {
  const [scriptInput, setScriptInput] = useState("");
  const [selectedMode, setSelectedMode] = useState("Original");
  const [isCreating, setIsCreating] = useState(false);

  const handleScriptCreation = async (action: "generate" | "upload") => {
    if (!scriptInput.trim() && action === "generate") return;

    setIsCreating(true);
    console.log(`${action} script:`, { input: scriptInput, mode: selectedMode });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsCreating(false);
    if (action === "generate") setScriptInput("");
  };

  return (
    <section className="from-primary/5 via-background to-accent/5 relative overflow-hidden rounded-2xl bg-gradient-to-br p-8 md:p-12">
      <div className="relative z-10 space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="aurora-text from-primary to-primary animate-pulse bg-gradient-to-r via-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            Script Today
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Transform your ideas into compelling content with AI-powered script generation
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={selectedMode} onValueChange={setSelectedMode}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Original">Original</SelectItem>
                <SelectItem value="Fixer">Fixer</SelectItem>
                <SelectItem value="Rewriter">Rewriter</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Describe your content idea or paste existing script..."
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              className="h-12 flex-1"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => handleScriptCreation("generate")}
              disabled={!scriptInput.trim() || isCreating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 flex-1"
            >
              {isCreating ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Generate Script
            </Button>

            <Button onClick={() => handleScriptCreation("upload")} variant="outline" className="h-12 flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Upload Script
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 opacity-20">
        <div className="bg-primary/20 absolute top-0 left-0 h-32 w-32 rounded-full blur-3xl" />
        <div className="absolute right-0 bottom-0 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
      </div>
    </section>
  );
}
