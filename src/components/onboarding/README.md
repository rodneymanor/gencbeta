# AI Ghostwriter Onboarding Components

This directory contains React components for setting up an AI Ghostwriter onboarding flow. The components are fully typed with TypeScript and use Tailwind CSS for styling.

## Components

### `AIGhostwriterSetup`

The main form component for collecting user preferences for AI content generation.

**Features:**
- Overview description input
- Topics textarea with AI-powered suggestion
- Writing guidelines with preset styles
- Fully controlled inputs with TypeScript
- Loading states for async operations
- Responsive design (mobile-first)

### `AIGhostwriterOnboardingModal`

A modal wrapper that contains the `AIGhostwriterSetup` component for use in onboarding flows.

**Features:**
- Modal dialog with backdrop
- Automatic closing on successful completion
- Error handling
- Customizable image and content

### `OnboardingExample`

Example implementation showing how to use the components with API calls and state management.

## Usage

### Basic Modal Usage

```tsx
import { AIGhostwriterOnboardingModal } from "@/components/onboarding";

function MyApp() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleComplete = async (data) => {
    // Save to your backend
    await fetch("/api/user/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  return (
    <AIGhostwriterOnboardingModal
      open={showOnboarding}
      onOpenChange={setShowOnboarding}
      imageSrc="/your-custom-image.png"
      onComplete={handleComplete}
    />
  );
}
```

### Standalone Form Usage

```tsx
import { AIGhostwriterSetup } from "@/components/onboarding";

function OnboardingPage() {
  const handleSubmit = async (data) => {
    // Handle form submission
    console.log(data);
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <AIGhostwriterSetup
        imageSrc="/your-image.png"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

## Props

### AIGhostwriterSetup Props

```tsx
interface AIGhostwriterSetupProps {
  imageSrc?: string;                    // Custom image source
  imageAlt?: string;                    // Image alt text
  showHelpButton?: boolean;             // Show help button
  onHelpClick?: () => void;             // Help button callback
  initialValues?: FormData;             // Pre-fill form values
  onSubmit: (data: FormData) => Promise<void>;
  onGenerateTopics?: (description: string) => Promise<string>;
  isSubmitting?: boolean;               // Loading state for form
  isGeneratingTopics?: boolean;         // Loading state for AI generation
}
```

### FormData Type

```tsx
interface FormData {
  description: string;    // User's elevator pitch
  speaksAbout: string;    // Topics they write about (comma-separated)
  instructions: string;   // Writing guidelines and style preferences
}
```

## Styling

- Uses Tailwind CSS for all styling
- No inline styles
- Responsive design with mobile-first approach
- Includes shimmer effect for submit button
- Proper focus states and accessibility

## Customization

### Custom Image
Replace the default `imageSrc` prop with your own branded illustration.

### Custom Styles
The component uses standard Tailwind classes. You can customize:
- Color scheme (currently uses indigo/purple gradient)
- Typography
- Spacing and layout
- Button styles

### Style Presets
The component includes 4 preset writing styles:
- **Profound**: Deep, philosophical tone
- **Professional**: Formal, authoritative tone  
- **Personal**: First-person, story-driven tone
- **Controversial**: Outspoken, tough-love tone

You can modify these in the `stylePresets` array within the component.

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Heroicons
- Lucide React (for loading spinner)
- Your UI library's Dialog component

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Semantic HTML structure