# Process Timeline Component

A reusable timeline component for showing process progress with animated steps.

## Usage

### Basic Timeline

```tsx
import { ProcessTimeline, useProcessTimeline, type TimelineStep } from "@/components/ui/process-timeline"
import { Sparkles, FileCheck, CheckCircle } from "lucide-react"

const steps: TimelineStep[] = [
  {
    id: "step1",
    title: "Step 1",
    description: "Description of step 1",
    icon: Sparkles,
  },
  {
    id: "step2", 
    title: "Step 2",
    description: "Description of step 2",
    icon: FileCheck,
  },
  {
    id: "step3",
    title: "Step 3", 
    description: "Description of step 3",
    icon: CheckCircle,
  },
]

function MyProcess() {
  const { currentStepIndex, isProcessComplete, startProcess } = useProcessTimeline(steps)
  
  return (
    <ProcessTimeline
      steps={steps}
      currentStepIndex={currentStepIndex}
      isProcessComplete={isProcessComplete}
      title="My Process"
    />
  )
}
```

### With Sources

```tsx
const stepWithSources: TimelineStep = {
  id: "research",
  title: "Research Phase",
  description: "Gathering information",
  icon: BookOpen,
  showSources: true,
  sources: [
    {
      name: "Example Source",
      url: "https://example.com",
      domain: "example"
    }
  ]
}
```

### Pre-built Components

- `ScriptGenerationTimeline` - For script generation processes
- `CollectionTimeline` - For collection creation processes

## Props

### ProcessTimeline

- `steps`: Array of TimelineStep objects
- `currentStepIndex`: Index of currently active step (-1 = not started)
- `isProcessComplete`: Whether the process is complete
- `title`: Optional title (default: "Process Progress")
- `className`: Optional additional CSS classes

### useProcessTimeline Hook

- `steps`: Array of steps
- `stepDuration`: Duration of each step in ms (default: 2000)

Returns:
- `currentStepIndex`: Current step index
- `isProcessComplete`: Completion status
- `isRunning`: Whether process is running
- `startProcess()`: Start the process
- `resetProcess()`: Reset to initial state
- `nextStep()`: Manually advance to next step
- `completeProcess()`: Manually complete the process