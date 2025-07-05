"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { RefinementControls } from "./types";

interface RefinementControlsProps {
  refinementControls: RefinementControls;
  setRefinementControls: React.Dispatch<React.SetStateAction<RefinementControls>>;
}

export function RefinementControlsSection({ refinementControls, setRefinementControls }: RefinementControlsProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Refinement Controls</h4>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-muted-foreground text-xs">Tone of Voice</label>
          <Select
            value={refinementControls.toneOfVoice}
            onValueChange={(value) => setRefinementControls((prev) => ({ ...prev, toneOfVoice: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="witty">Witty</SelectItem>
              <SelectItem value="serious">Serious</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-muted-foreground text-xs">Voice Engine</label>
          <Select
            value={refinementControls.voiceEngine}
            onValueChange={(value) => setRefinementControls((prev) => ({ ...prev, voiceEngine: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creator-a">Creator A</SelectItem>
              <SelectItem value="creator-b">Creator B</SelectItem>
              <SelectItem value="generic">Generic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-muted-foreground text-xs">Script Length</label>
          <Select
            value={refinementControls.scriptLength}
            onValueChange={(value) => setRefinementControls((prev) => ({ ...prev, scriptLength: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 seconds</SelectItem>
              <SelectItem value="60">60 seconds</SelectItem>
              <SelectItem value="90">90 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
