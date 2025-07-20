"use client"

import { FolderPlus, Search, FileText, CheckCircle } from "lucide-react"
import { ProcessTimeline, useProcessTimeline, type TimelineStep } from "./process-timeline"

const collectionSteps: TimelineStep[] = [
  {
    id: "creating",
    title: "Creating Collection",
    description: "Setting up your new collection with the specified parameters.",
    icon: FolderPlus,
  },
  {
    id: "analyzing",
    title: "Analyzing Content",
    description: "Examining videos and extracting key insights.",
    icon: Search,
  },
  {
    id: "organizing",
    title: "Organizing Content",
    description: "Categorizing and structuring your content for easy access.",
    icon: FileText,
  },
  {
    id: "complete",
    title: "Collection Ready",
    description: "Your collection has been created and is ready to use!",
    icon: CheckCircle,
  },
]

interface CollectionTimelineProps {
  onComplete?: () => void
  className?: string
}

export function CollectionTimeline({ onComplete, className }: CollectionTimelineProps) {
  const { currentStepIndex, isProcessComplete, isRunning, startProcess } = useProcessTimeline(
    collectionSteps,
    1500 // Slightly faster for collections
  )

  // Call onComplete when process finishes
  if (isProcessComplete && onComplete) {
    onComplete()
  }

  if (!isRunning && currentStepIndex === -1) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <button
          onClick={startProcess}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-600/50 transition-colors duration-300"
        >
          Create Collection
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <ProcessTimeline
        steps={collectionSteps}
        currentStepIndex={currentStepIndex}
        isProcessComplete={isProcessComplete}
        title="Collection Creation Progress"
        className={className}
      />
    </div>
  )
}