"use client"

import { useEffect } from "react"
import { Sparkles, FileCheck, BookOpen, CheckCircle } from "lucide-react"
import { ProcessTimeline, useProcessTimeline, type TimelineStep } from "./process-timeline"

const ghostWriterSteps: TimelineStep[] = [
  {
    id: "analyzing",
    title: "Analyzing Your Idea",
    description: "Ghost Writer is examining your content idea and gathering insights.",
    icon: Sparkles,
  },
  {
    id: "generating",
    title: "Generating Script Options",
    description: "Creating two unique script variations for you to choose from.",
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
        name: "Content Strategy Best Practices",
        url: "https://contentmarketinginstitute.com/articles/content-strategy/",
        domain: "contentmarketinginstitute",
      },
      {
        name: "Social Media Engagement Tips",
        url: "https://blog.hootsuite.com/social-media-engagement/",
        domain: "hootsuite",
      },
      {
        name: "Script Writing for Social Media",
        url: "https://later.com/blog/social-media-video-script/",
        domain: "later",
      },
      {
        name: "AI Content Creation Guide",
        url: "https://www.jasper.ai/blog/ai-content-creation",
        domain: "jasper",
      },
    ],
  },
  {
    id: "ready",
    title: "Scripts Ready",
    description: "Your script options are ready for review and selection!",
    icon: CheckCircle,
  },
]

interface GhostWriterTimelineProps {
  onComplete: () => void
  className?: string
}

export function GhostWriterTimelineComponent({ onComplete, className }: GhostWriterTimelineProps) {
  const { currentStepIndex, isProcessComplete, startProcess } = useProcessTimeline(
    ghostWriterSteps,
    2500 // Slightly longer steps for script generation
  )

  // Auto-start the process when component mounts
  useEffect(() => {
    startProcess()
  }, [startProcess])

  // Call onComplete when process finishes
  useEffect(() => {
    if (isProcessComplete) {
      // Small delay to let user see completion before navigating
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [isProcessComplete, onComplete])

  return (
    <ProcessTimeline
      steps={ghostWriterSteps}
      currentStepIndex={currentStepIndex}
      isProcessComplete={isProcessComplete}
      title="Script Generation Progress"
      className={className}
    />
  )
}