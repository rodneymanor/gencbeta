"use client"

import { Sparkles, FileCheck, BookOpen, CheckCircle } from "lucide-react"
import { ProcessTimeline, useProcessTimeline, type TimelineStep } from "./process-timeline"

const scriptGenerationSteps: TimelineStep[] = [
  {
    id: "generating",
    title: "Generating Script",
    description: "Ghost Writer is taking your idea and generating the script.",
    icon: Sparkles,
  },
  {
    id: "finalizing",
    title: "Finalizing Script",
    description: "Polishing the script for clarity and flow.",
    icon: FileCheck,
  },
  {
    id: "sources",
    title: "Loading Sources",
    description: "Gathering relevant information and references.",
    icon: BookOpen,
    showSources: true,
    sources: [
      {
        name: "Perplexity AI logo design - Icons8",
        url: "https://icons8.com/icons/set/perplexity-ai",
        domain: "icons8",
      },
      {
        name: "Create an Atomic Logo | Design.com",
        url: "https://www.design.com/maker/tag/atomic",
        domain: "design",
      },
      { name: "Letter C Logo - Dribbble", url: "https://dribbble.com/tags/c-logo", domain: "dribbble" },
      {
        name: "Branding & Design Studio - Smith & Diction",
        url: "https://smith-diction.com/work",
        domain: "smith-diction",
      },
    ],
  },
  {
    id: "ready",
    title: "Script Ready",
    description: "Your final script is ready!",
    icon: CheckCircle,
  },
]

export function ScriptGenerationTimeline() {
  const { currentStepIndex, isProcessComplete, isRunning, startProcess } = useProcessTimeline(scriptGenerationSteps)

  if (!isRunning && currentStepIndex === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <button
          onClick={startProcess}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-600/50 transition-colors duration-300"
        >
          Submit Script Idea
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <ProcessTimeline
        steps={scriptGenerationSteps}
        currentStepIndex={currentStepIndex}
        isProcessComplete={isProcessComplete}
        title="Script Generation Progress"
      />
    </div>
  )
}