"use client"

import { useEffect, useState } from "react"
import { FileText, Edit, CheckCircle } from "lucide-react"
import { ProcessTimeline, type TimelineStep } from "./process-timeline"

const scriptLoadingSteps: TimelineStep[] = [
  {
    id: "loading",
    title: "Loading Script",
    description: "Preparing your selected script for editing.",
    icon: FileText,
  },
  {
    id: "editing",
    title: "Opening Editor",
    description: "Setting up the Hemingway Editor with your content.",
    icon: Edit,
  },
  {
    id: "ready",
    title: "Ready to Edit",
    description: "Your script is loaded and ready for refinement!",
    icon: CheckCircle,
  },
]

interface ScriptLoadingTimelineModalProps {
  isOpen: boolean
  onComplete: () => void
  onCancel?: () => void
}

export function ScriptLoadingTimelineModal({ 
  isOpen, 
  onComplete,
  onCancel
}: ScriptLoadingTimelineModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isProcessComplete, setIsProcessComplete] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0)
      setIsProcessComplete(false)
      startScriptLoading()
    } else {
      setCurrentStepIndex(-1)
      setIsProcessComplete(false)
    }
  }, [isOpen])

  const startScriptLoading = async () => {
    try {
      // Step 1: Loading (immediate)
      setCurrentStepIndex(0)
      
      // Step 2: Opening Editor (after 2.5 seconds)
      setTimeout(() => {
        setCurrentStepIndex(1)
        
        // Step 3: Ready (after another 2.5 seconds)
        setTimeout(() => {
          setCurrentStepIndex(2)
          setIsProcessComplete(true)
          
          // Complete process after a longer delay for reading
          setTimeout(() => {
            onComplete()
          }, 2000)
        }, 2500)
      }, 2500)

    } catch (error) {
      console.error("🔄 [ScriptLoading] Timeline error:", error)
      // Still complete on error
      setTimeout(() => {
        onComplete()
      }, 2000)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-lg w-full mx-4">
        <ProcessTimeline
          steps={scriptLoadingSteps}
          currentStepIndex={currentStepIndex}
          isProcessComplete={isProcessComplete}
          title="Preparing Your Script"
          className="mx-auto shadow-xl"
        />
      </div>
    </div>
  )
}