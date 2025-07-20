"use client"

import { useEffect, useState } from "react"
import { Sparkles, FileCheck, BookOpen, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProcessTimeline, type TimelineStep } from "./process-timeline"
import { ContentIdea } from "@/types/ghost-writer"

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
    description: "Taking you to the editor...",
    icon: CheckCircle,
  },
]

interface GhostWriterTimelineModalProps {
  isOpen: boolean
  idea: ContentIdea | null
  onComplete: (result: any) => void
  onError: (error: string) => void
  onCancel?: () => void
}

export function GhostWriterTimelineModal({ 
  isOpen, 
  idea, 
  onComplete, 
  onError,
  onCancel 
}: GhostWriterTimelineModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isProcessComplete, setIsProcessComplete] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && idea) {
      setCurrentStepIndex(0)
      setIsProcessComplete(false)
      setHasError(false)
      setErrorMessage("")
      setIsRetrying(false)
      startScriptGeneration()
    } else {
      setCurrentStepIndex(-1)
      setIsProcessComplete(false)
      setHasError(false)
      setErrorMessage("")
      setIsRetrying(false)
    }
  }, [isOpen, idea])

  const startScriptGeneration = async () => {
    if (!idea) return

    try {
      // Step 1: Analyzing (immediate)
      setCurrentStepIndex(0)
      
      // Step 2: Generating (after 2 seconds, start API call)
      setTimeout(async () => {
        setCurrentStepIndex(1)
        
        try {
          // Get Firebase Auth token
          const { auth } = await import("@/lib/firebase")
          if (!auth?.currentUser) {
            throw new Error("User not authenticated")
          }

          const token = await auth.currentUser.getIdToken()
          console.log("🔄 [GhostWriter] Generating script for idea:", idea.hook)

          const response = await fetch("/api/script/speed-write", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              idea: idea.hook,
              length: idea.estimatedDuration || "60",
              type: "speed",
              ideaId: idea.id,
              ideaData: {
                concept: idea.concept,
                hookTemplate: idea.hookTemplate,
                peqCategory: idea.peqCategory,
                sourceText: idea.sourceText,
                targetAudience: idea.targetAudience,
              },
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("🔄 [GhostWriter] Script generation failed:", errorText)
            
            // Try to parse the error response
            try {
              const errorData = JSON.parse(errorText)
              if (errorData.error) {
                throw new Error(errorData.error)
              }
            } catch (parseError) {
              // If we can't parse, fall back to status-based error
            }
            
            throw new Error(`Failed to generate script: ${response.status}`)
          }

          const result = await response.json()
          console.log("🔄 [GhostWriter] Script generation successful:", result)

          // Step 3: Loading Sources (after API completes)
          setCurrentStepIndex(2)
          
          // Step 4: Ready (after sources step)
          setTimeout(() => {
            setCurrentStepIndex(3)
            setIsProcessComplete(true)
            
            // Check if only one script option is available for auto-selection
            const hasOptionA = result.optionA && result.optionA.content;
            const hasOptionB = result.optionB && result.optionB.content;
            const singleOption = hasOptionA && !hasOptionB ? result.optionA : 
                                !hasOptionA && hasOptionB ? result.optionB : null;

            if (singleOption) {
              console.log("🔄 [GhostWriter] Only one script option available, auto-selecting:", singleOption.title);
              
              // Update the final step description for auto-selection
              ghostWriterSteps[3].description = "Auto-selecting script and taking you directly to the editor...";
              
              // Add auto-selection flag and selected option to result
              const autoSelectResult = {
                ...result,
                autoSelect: true,
                selectedOption: singleOption
              };
              
              // Complete process immediately for auto-selection
              setTimeout(() => {
                onComplete(autoSelectResult)
              }, 1000)
            } else {
              // Reset description for manual selection
              ghostWriterSteps[3].description = "Taking you to the script selection page...";
              
              // Complete process after a longer delay to allow user to see completion
              // This gives time for the success state to be visible before navigation
              setTimeout(() => {
                onComplete(result)
              }, 2000)
            }
          }, 2000)

        } catch (error) {
          console.error("🔄 [GhostWriter] Script generation error:", error)
          
          let errorMsg = "Failed to generate scripts"
          
          // Parse the error message for specific cases
          if (error instanceof Error) {
            const errorStr = error.message
            if (errorStr.includes("safety guidelines")) {
              errorMsg = "Content flagged by safety guidelines. Please try a different topic or rephrase your idea."
            } else if (errorStr.includes("400")) {
              errorMsg = "Invalid request. Please try a different approach or contact support."
            } else if (errorStr.includes("401") || errorStr.includes("403")) {
              errorMsg = "Authentication error. Please refresh the page and try again."
            } else if (errorStr.includes("429")) {
              errorMsg = "Too many requests. Please wait a moment and try again."
            } else if (errorStr.includes("500")) {
              errorMsg = "Server error. Please try again in a few moments."
            } else {
              errorMsg = errorStr
            }
          }
          
          setHasError(true)
          setErrorMessage(errorMsg)
        }
      }, 2000)

    } catch (error) {
      console.error("🔄 [GhostWriter] Timeline error:", error)
      setHasError(true)
      setErrorMessage("Failed to start script generation")
    }
  }

  const handleRetry = () => {
    setIsRetrying(true)
    setHasError(false)
    setErrorMessage("")
    setCurrentStepIndex(0)
    setIsProcessComplete(false)
    
    // Small delay to show the retry state
    setTimeout(() => {
      setIsRetrying(false)
      startScriptGeneration()
    }, 500)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onError("User cancelled")
    }
  }

  if (!isOpen) return null

  // Error state
  if (hasError) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="relative max-w-lg w-full mx-4 bg-background border border-border/50 rounded-xl shadow-xl">
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-warning/10 to-destructive/10 border border-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2 text-foreground">Script Generation Failed</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {errorMessage}
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="px-6 border-border hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground border-none shadow-md transition-all duration-200"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-lg w-full mx-4">
        <ProcessTimeline
          steps={ghostWriterSteps}
          currentStepIndex={currentStepIndex}
          isProcessComplete={isProcessComplete}
          title="Script Generation Progress"
          className="mx-auto shadow-xl"
        />
      </div>
    </div>
  )
}