# Modular Gemini AI Integration

A scalable, type-safe, and modular architecture for integrating Google Gemini AI into React applications.

## Overview

This system provides:
- **Centralized Gemini Service** with dynamic model support, retry logic, and comprehensive error handling
- **Modular Prompt Management** with template processing, validation, and composition
- **Type-Safe Script Generation** with multiple engines and A/B testing
- **React Integration Layer** for seamless frontend integration
- **Backward Compatibility** with existing codebases

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
├─────────────────────────────────────────────────────────────┤
│                 Client Script Service                       │
├─────────────────────────────────────────────────────────────┤
│              Script Generation Service                      │
├─────────────────────────────────────────────────────────────┤
│    Prompt Manager    │    Gemini Service    │  Types       │
├─────────────────────────────────────────────────────────────┤
│                    Google Gemini API                        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Initialize the Prompt Library

```typescript
import { ensurePromptLibraryInitialized } from "@/lib/prompts";

// Automatically initializes all registered prompts
ensurePromptLibraryInitialized();
```

### 2. Generate Scripts (React Component)

```typescript
import { ClientScriptService } from "@/lib/services/client-script-service";

export function MyComponent() {
  const handleGenerate = async () => {
    const result = await ClientScriptService.generateSpeedWrite({
      idea: "How to be more productive",
      length: "60",
      userId: "user123",
    });

    if (result.success) {
      console.log("Option A:", result.optionA?.content);
      console.log("Option B:", result.optionB?.content);
    }
  };

  return <button onClick={handleGenerate}>Generate Script</button>;
}
```

### 3. Direct Prompt Execution

```typescript
import { executePrompt } from "@/lib/prompts";

const result = await executePrompt<SpeedWriteResult>("speed-write-v2", {
  variables: {
    idea: "Productivity tips for remote workers",
    length: "60",
    targetWords: 132,
  },
});
```

### 4. Custom Gemini Requests

```typescript
import { geminiService, GEMINI_MODELS } from "@/lib/services/gemini-service";

const response = await geminiService.generateContent({
  prompt: "Write a short story about AI",
  model: GEMINI_MODELS.PRO,
  temperature: 0.9,
  maxTokens: 500,
  responseType: "text",
});
```

## Core Services

### Gemini Service

**Location**: `src/lib/services/gemini-service.ts`

Centralized service for all Gemini API interactions with:
- Dynamic model selection
- Comprehensive error handling and retry logic
- Request timeout and rate limiting
- Response caching
- Batch processing support
- Audio transcription capabilities

```typescript
// Basic usage
const response = await geminiService.generateContent({
  prompt: "Your prompt here",
  model: GEMINI_MODELS.FLASH,
  temperature: 0.7,
  responseType: "json",
});

// Batch processing
const results = await geminiService.generateBatch([
  { prompt: "Prompt 1", model: GEMINI_MODELS.FLASH },
  { prompt: "Prompt 2", model: GEMINI_MODELS.PRO },
], { concurrency: 2, failFast: false });

// Audio transcription
const transcription = await geminiService.transcribeAudio({
  mimeType: "audio/wav",
  data: audioBuffer,
});
```

### Prompt Management System

**Location**: `src/lib/prompts/`

Modular prompt management with:
- Template variable processing
- Input validation
- JSON schema enforcement
- Prompt composition
- Version control
- Category organization

```typescript
// Register a prompt
import { registerPrompt } from "@/lib/prompts";

const myPrompt: Prompt = {
  id: "my-prompt",
  name: "My Custom Prompt",
  description: "A sample prompt",
  version: "1.0.0",
  template: "Write about {{topic}} in {{tone}} tone",
  config: {
    temperature: 0.8,
    maxTokens: 500,
    validation: {
      required: ["topic", "tone"],
      minLength: { topic: 3 }
    }
  }
};

registerPrompt(myPrompt, "custom");

// Execute the prompt
const result = await executePrompt("my-prompt", {
  variables: { topic: "AI", tone: "casual" }
});
```

### Script Generation Service

**Location**: `src/lib/services/script-generation-service.ts`

High-level service for script generation with:
- Multiple script engines (Speed, Educational, Viral)
- A/B testing support
- Negative keyword filtering
- Performance tracking
- Batch generation

```typescript
import { scriptGenerationService } from "@/lib/services/script-generation-service";

// Single script generation
const script = await scriptGenerationService.generateScript({
  idea: "Morning routine tips",
  length: "60",
  userId: "user123",
  type: "educational",
  tone: "professional",
  platform: "youtube",
});

// A/B testing
const options = await scriptGenerationService.generateOptions({
  idea: "Productivity hacks",
  length: "30",
  userId: "user123",
});
```

## Prompt System

### Speed Write Prompts

**Location**: `src/lib/prompts/script-generation/speed-write.ts`

Three variants available:
- **Standard**: Balanced engagement and value
- **Educational**: Teaching-focused with clear explanations  
- **Viral**: Maximum shareability and engagement

```typescript
import { generateSpeedWriteScript } from "@/lib/prompts/script-generation";

// Generate with specific variant
const result = await generateSpeedWriteScript(
  "How to wake up early",
  "60",
  {
    variant: "educational",
    tone: "energetic",
    platform: "tiktok",
  }
);
```

### Prompt Structure

Each prompt follows this structure:

```typescript
interface Prompt {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  description: string;           // What the prompt does
  version: string;               // Semantic versioning
  template: string;              // Template with {{variables}}
  config: {
    systemInstruction?: string;  // AI behavior guidance
    temperature?: number;        // Creativity level (0-1)
    maxTokens?: number;         // Response length limit
    responseType?: "text" | "json";
    jsonSchema?: JSONSchema;     // For structured responses
    validation?: {               // Input validation rules
      required?: string[];
      minLength?: Record<string, number>;
      pattern?: Record<string, RegExp>;
    };
    examples?: Array<{          // Few-shot examples
      input: PromptVariables;
      output: string;
    }>;
  };
}
```

## React Integration

### Client Script Service

**Location**: `src/lib/services/client-script-service.ts`

Frontend-optimized service that:
- Handles authentication automatically
- Provides legacy compatibility
- Manages loading states
- Transforms API responses
- Includes error handling

```typescript
import { ClientScriptService } from "@/lib/services/client-script-service";

// In a React component
const [loading, setLoading] = useState(false);
const [result, setResult] = useState(null);

const handleGenerate = async () => {
  setLoading(true);
  try {
    const response = await ClientScriptService.generateSpeedWrite({
      idea: scriptIdea,
      length: "60",
      userId: user.uid,
    });
    
    setResult(response);
  } catch (error) {
    console.error("Generation failed:", error);
  } finally {
    setLoading(false);
  }
};
```

### Migration from Legacy Code

Replace existing API calls:

```typescript
// OLD WAY
const response = await fetch("/api/script/speed-write", {
  method: "POST",
  headers: { ... },
  body: JSON.stringify({ ... }),
});

// NEW WAY
const response = await ClientScriptService.generateSpeedWrite({
  idea: "Your idea",
  length: "60",
  userId: "user123",
});
```

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
GEMINI_DEFAULT_MODEL=gemini-2.0-flash
GEMINI_TIMEOUT=30000
GEMINI_MAX_RETRIES=2
```

### Service Configuration

```typescript
import { geminiService } from "@/lib/services/gemini-service";

// Clear cache if needed
geminiService.clearCache();

// Check service health
const metrics = await geminiService.getMetrics();
```

## Error Handling

The system provides comprehensive error handling:

```typescript
interface GeminiResponse<T> {
  success: boolean;
  content?: T;
  error?: string;
  tokensUsed?: number;
  responseTime?: number;
  retryCount?: number;
}

// Error handling pattern
const result = await geminiService.generateContent(request);

if (!result.success) {
  switch (result.error) {
    case "Request timed out":
      // Handle timeout
      break;
    case "API quota exceeded":
      // Handle quota
      break;
    default:
      // Handle other errors
      break;
  }
}
```

## Performance Optimization

### Caching

The system includes intelligent caching:
- Model instances are cached per configuration
- Prompt templates are parsed once
- Response caching for identical requests

### Batch Processing

For multiple requests:

```typescript
// Process multiple scripts efficiently
const inputs = [
  { idea: "Idea 1", length: "60", userId: "user1" },
  { idea: "Idea 2", length: "30", userId: "user2" },
];

const results = await scriptGenerationService.generateBatch(inputs, {
  concurrency: 3,          // Process 3 at a time
  failFast: false,         // Continue on errors
});
```

### Monitoring

Built-in performance monitoring:

```typescript
interface PerformanceMetrics {
  requestId: string;
  operation: string;
  duration: number;
  tokensUsed?: number;
  success: boolean;
}
```

## Advanced Usage

### Custom Prompts

Create domain-specific prompts:

```typescript
import { Prompt, registerPrompt } from "@/lib/prompts";

const customPrompt: Prompt = {
  id: "product-description",
  name: "Product Description Generator",
  description: "Creates compelling product descriptions",
  version: "1.0.0",
  template: `Create a {{tone}} product description for:
Product: {{productName}}
Features: {{features}}
Target Audience: {{audience}}`,
  config: {
    systemInstruction: "You are an expert copywriter...",
    temperature: 0.8,
    maxTokens: 300,
    validation: {
      required: ["productName", "features", "audience"],
      minLength: { productName: 3, features: 10 }
    }
  }
};

registerPrompt(customPrompt, "marketing");
```

### Prompt Composition

Combine multiple prompts:

```typescript
import { composePrompts } from "@/lib/prompts";

const mainTemplate = `
{{hook_section}}

{{content_section}}

{{cta_section}}
`;

const subPrompts = {
  hook_section: "Create an attention-grabbing hook about {{topic}}",
  content_section: "Provide valuable information about {{topic}}",
  cta_section: "End with a compelling call to action",
};

const composedPrompt = composePrompts(mainTemplate, subPrompts);
```

### Model Selection Strategy

Choose models based on use case:

```typescript
import { GEMINI_MODELS } from "@/lib/services/gemini-service";

// For creative content
const creativeConfig = {
  model: GEMINI_MODELS.PRO,
  temperature: 0.9,
  maxTokens: 1000,
};

// For structured data
const structuredConfig = {
  model: GEMINI_MODELS.FLASH,
  temperature: 0.3,
  responseType: "json",
};

// For speed-optimized tasks
const speedConfig = {
  model: GEMINI_MODELS.FLASH_8B,
  temperature: 0.7,
  maxTokens: 500,
};
```

## Testing

### Unit Tests

```typescript
import { geminiService } from "@/lib/services/gemini-service";

describe("Gemini Service", () => {
  it("should generate content", async () => {
    const response = await geminiService.generateContent({
      prompt: "Test prompt",
      model: GEMINI_MODELS.FLASH,
    });
    
    expect(response.success).toBe(true);
    expect(response.content).toBeDefined();
  });
});
```

### Mock Service

For testing without API calls:

```typescript
// Create a mock service for tests
class MockGeminiService {
  async generateContent(request) {
    return {
      success: true,
      content: "Mock response",
      responseTime: 100,
    };
  }
}
```

## Migration Guide

### From Existing Implementation

1. **Update imports**:
   ```typescript
   // OLD
   import { generateScript } from "@/lib/gemini";
   
   // NEW
   import { ClientScriptService } from "@/lib/services/client-script-service";
   ```

2. **Update API calls**:
   ```typescript
   // OLD
   const result = await generateScript(prompt, options);
   
   // NEW
   const result = await ClientScriptService.generateSpeedWrite({
     idea: prompt,
     length: "60",
     userId: user.uid,
   });
   ```

3. **Update error handling**:
   ```typescript
   // OLD
   if (result.success) { /* handle success */ }
   
   // NEW (same interface)
   if (result.success) { /* handle success */ }
   ```

## Best Practices

1. **Always handle errors gracefully**
2. **Use appropriate models for your use case**
3. **Implement proper validation for user inputs**
4. **Cache responses when possible**
5. **Monitor performance and token usage**
6. **Use batch processing for multiple requests**
7. **Provide fallbacks for API failures**

## Troubleshooting

### Common Issues

1. **Authentication errors**: Check `GEMINI_API_KEY` environment variable
2. **Timeout errors**: Increase timeout or reduce request complexity
3. **Quota errors**: Implement backoff strategies
4. **JSON parsing errors**: Validate response format
5. **Prompt validation errors**: Check required variables

### Debug Mode

Enable detailed logging:

```typescript
// Set environment variable
process.env.DEBUG_GEMINI = "true";

// Or use console debugging
console.log("Request:", request);
console.log("Response:", response);
```

## Contributing

When adding new features:

1. Follow TypeScript interfaces in `types.ts`
2. Add comprehensive error handling
3. Include unit tests
4. Update documentation
5. Maintain backward compatibility
6. Add performance monitoring

## API Reference

See `types.ts` for complete TypeScript definitions of all interfaces and types used throughout the system.