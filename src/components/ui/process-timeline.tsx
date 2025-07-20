"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

export interface TimelineStep {
  id: string | number
  title: string
  description: string
  icon: React.ElementType
  showSources?: boolean
  sources?: { name: string; url: string; domain: string }[]
}

export interface ProcessTimelineProps {
  steps: TimelineStep[]
  currentStepIndex: number
  isProcessComplete: boolean
  title?: string
  className?: string
}

interface TimelineItemProps {
  step: TimelineStep
  isActive: boolean
  isCompleted: boolean
  isLast: boolean
}

const TimelineItem: React.FC<TimelineItemProps> = ({ step, isActive, isCompleted, isLast }) => {
  const Icon = step.icon
  const circleColorClass = isCompleted 
    ? "bg-gradient-to-r from-primary to-accent" 
    : isActive 
    ? "bg-gradient-to-r from-primary to-accent animate-pulse" 
    : "bg-muted border border-border"
  const lineColorClass = isCompleted ? "bg-gradient-to-b from-primary to-accent" : "bg-border"
  const textColorClass = isCompleted || isActive ? "text-foreground" : "text-muted-foreground"

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full ${circleColorClass} flex items-center justify-center transition-all duration-300 shadow-sm`}
        >
          {isActive && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary-foreground" />}
        </div>
        {!isLast && <div className={`w-0.5 flex-grow ${lineColorClass} transition-colors duration-300`} />}
      </div>
      <div className="flex-1 pb-8">
        <h3 className={`font-semibold text-lg ${textColorClass} transition-colors duration-300`}>{step.title}</h3>
        <p className={`text-sm ${textColorClass} transition-colors duration-300`}>{step.description}</p>
        <AnimatePresence>
          {isActive && step.showSources && step.sources && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-3 border border-border/50 rounded-lg bg-muted/20 text-card-foreground shadow-sm overflow-hidden backdrop-blur-sm"
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">Sources:</p>
              <ul className="space-y-1 text-sm">
                {step.sources.map((source, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <img
                      alt={`${source.domain} favicon`}
                      width="16"
                      height="16"
                      src={`https://www.google.com/s2/favicons?sz=128&domain=${source.domain}.com`}
                      className="rounded-full"
                    />
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-accent hover:underline text-xs transition-colors duration-200"
                    >
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function ProcessTimeline({ 
  steps, 
  currentStepIndex, 
  isProcessComplete, 
  title = "Process Progress",
  className = ""
}: ProcessTimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-md bg-background border border-border/50 text-card-foreground rounded-xl shadow-lg p-6 ${className}`}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
      <div className="relative">
        {steps.map((step, index) => (
          <TimelineItem
            key={step.id}
            step={step}
            isActive={index === currentStepIndex}
            isCompleted={index < currentStepIndex || isProcessComplete}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
      {isProcessComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-6 text-center text-primary font-semibold"
        >
          Process Completed!
        </motion.div>
      )}
    </motion.div>
  )
}

export function useProcessTimeline(steps: TimelineStep[], stepDuration: number = 2000) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isProcessComplete, setIsProcessComplete] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const startProcess = () => {
    setCurrentStepIndex(0)
    setIsProcessComplete(false)
    setIsRunning(true)
  }

  const resetProcess = () => {
    setCurrentStepIndex(-1)
    setIsProcessComplete(false)
    setIsRunning(false)
  }

  const nextStep = () => {
    setCurrentStepIndex(prev => prev + 1)
  }

  const completeProcess = () => {
    setIsProcessComplete(true)
    setIsRunning(false)
  }

  useEffect(() => {
    if (isRunning && currentStepIndex >= 0 && currentStepIndex < steps.length) {
      const timer = setTimeout(() => {
        if (currentStepIndex === steps.length - 1) {
          completeProcess()
        } else {
          nextStep()
        }
      }, stepDuration)

      return () => clearTimeout(timer)
    }
  }, [isRunning, currentStepIndex, steps.length, stepDuration])

  return {
    currentStepIndex,
    isProcessComplete,
    isRunning,
    startProcess,
    resetProcess,
    nextStep,
    completeProcess
  }
}