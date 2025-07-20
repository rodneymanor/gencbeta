"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Sparkles, CheckCircle } from "lucide-react"
import { ProcessTimeline, type TimelineStep } from "./process-timeline"

const refreshSteps: TimelineStep[] = [
  {
    id: "analyzing",
    title: "Analyzing Your Profile",
    description: "Reviewing your brand profile and content preferences.",
    icon: RefreshCw,
  },
  {
    id: "generating",
    title: "Generating Fresh Ideas",
    description: "Creating new content ideas tailored to your brand.",
    icon: Sparkles,
  },
  {
    id: "ready",
    title: "Ideas Ready!",
    description: "Your fresh content ideas are ready to inspire your next post.",
    icon: CheckCircle,
  },
]

interface GhostWriterRefreshTimelineModalProps {
  isOpen: boolean
  onComplete: () => void
  onCancel?: () => void
}

export function GhostWriterRefreshTimelineModal({ 
  isOpen, 
  onComplete,
  onCancel
}: GhostWriterRefreshTimelineModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isProcessComplete, setIsProcessComplete] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0)
      setIsProcessComplete(false)
      startRefreshProcess()
    } else {
      setCurrentStepIndex(-1)
      setIsProcessComplete(false)
    }
  }, [isOpen])

  const startRefreshProcess = async () => {
    try {
      // Step 1: Analyzing (immediate)
      setCurrentStepIndex(0)
      
      // Step 2: Generating (after 2 seconds)
      setTimeout(() => {
        setCurrentStepIndex(1)
        
        // Step 3: Ready (after another 2 seconds)
        setTimeout(() => {
          setCurrentStepIndex(2)
          setIsProcessComplete(true)
          
          // Complete process after a short delay
          setTimeout(() => {
            onComplete()
          }, 1000)
        }, 2000)
      }, 2000)

    } catch (error) {
      console.error("🔄 [GhostWriter] Refresh timeline error:", error)
      // Still complete on error
      setTimeout(() => {
        onComplete()
      }, 1000)
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
          steps={refreshSteps}
          currentStepIndex={currentStepIndex}
          isProcessComplete={isProcessComplete}
          title="Refreshing Your Ideas"
          className="mx-auto shadow-xl"
        />
      </div>
    </div>
  )
}