# Integration Guide for New App

This guide shows you how to integrate the Template Generator Service into your new application.

## Quick Integration Steps

### 1. Copy the Service Files

Copy the entire `template-generator-service` folder into your new app:

```bash
# From your new app directory
cp -r /path/to/template-generator-service ./lib/
```

### 2. Install Dependencies

```bash
cd lib/template-generator-service
npm install
npm run build
```

### 3. Set Environment Variable

Add to your `.env` file:

```bash
GEMINI_API_KEY=AIzaSyYourApiKeyHere
```

### 4. Import and Use

```typescript
import { TemplateGenerator } from "./lib/template-generator-service";

// In your app logic
const generator = new TemplateGenerator();

// Generate templates from marketing segments
const result = await generator.generateTemplatesFromSegments({
  Hook: "Your hook text here...",
  Bridge: "Your bridge text here...",
  "Golden Nugget": "Your golden nugget text here...",
  WTA: "Your WTA text here...",
});

if (result.success) {
  // Use the templates
  console.log(result.templates);
  console.log(result.originalContent);
}
```

## Integration Patterns

### Pattern 1: Simple Function Call

```typescript
// Your app function
async function processContent(content: string) {
  const generator = new TemplateGenerator();

  // Auto-analyze and generate templates
  const result = await generator.generateTemplatesFromTranscription(content);

  if (result.success) {
    return {
      templates: result.templates,
      originalContent: result.originalContent,
      processingTime: result.processingTime,
    };
  } else {
    throw new Error(`Template generation failed: ${result.error}`);
  }
}
```

### Pattern 2: API Endpoint

```typescript
// Next.js API route
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const generator = new TemplateGenerator();
    const { segments, transcription } = req.body;

    let result;
    if (segments) {
      result = await generator.generateTemplatesFromSegments(segments);
    } else if (transcription) {
      result = await generator.generateTemplatesFromTranscription(transcription);
    } else {
      return res.status(400).json({ error: "Either segments or transcription is required" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
```

### Pattern 3: Batch Processing

```typescript
// Process multiple content pieces
async function processBatchContent(contentList: string[]) {
  const generator = new TemplateGenerator();

  const inputs = contentList.map((content) => ({
    transcription: content,
  }));

  const batchResult = await generator.batchGenerateTemplates(inputs);

  return {
    successful: batchResult.results.filter((r) => r.success),
    failed: batchResult.results.filter((r) => !r.success),
    summary: batchResult.summary,
  };
}
```

## Error Handling

```typescript
const generator = new TemplateGenerator();

try {
  const result = await generator.generateTemplatesFromSegments(segments);

  if (!result.success) {
    // Handle specific error
    console.error("Template generation failed:", result.error);
    console.log("Processing time:", result.processingTime);

    // You can retry or use fallback logic
    return null;
  }

  // Success - use the templates
  return result.templates;
} catch (error) {
  // Handle unexpected errors
  console.error("Unexpected error:", error);
  throw error;
}
```

## Configuration Options

### Custom API Key

```typescript
// Pass API key directly
const generator = new TemplateGenerator("AIzaSyYourApiKeyHere");
```

### Environment Variables

```bash
# .env file
GEMINI_API_KEY=AIzaSyYourApiKeyHere
GEMINI_MODEL=gemini-2.0-flash
GEMINI_TIMEOUT=30000
GEMINI_RATE_LIMIT_DELAY=500
```

## Output Format

The service returns a consistent JSON format:

```typescript
interface TemplateResult {
  success: boolean;
  templates?: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  originalContent?: {
    Hook: string;
    Bridge: string;
    "Golden Nugget": string;
    WTA: string;
  };
  error?: string;
  processingTime: number;
  metadata?: {
    inputType: "marketing_segments" | "transcription";
    templatesGenerated: number;
    placeholdersIdentified: string[];
    processingMode: string;
  };
}
```

## Performance Considerations

- **Rate Limiting**: Service automatically handles 500ms delays between requests
- **Timeouts**: 30-second timeout per request
- **Batch Processing**: Use for multiple inputs to optimize API usage
- **Caching**: Consider caching results for repeated content

## Testing

```typescript
// Test the service
async function testTemplateGeneration() {
  const generator = new TemplateGenerator();

  const testSegments = {
    Hook: "This is a test hook for template generation.",
    Bridge: "Let me explain why this matters for testing.",
    "Golden Nugget": "The key insight is that testing ensures reliability.",
    WTA: "Start testing your templates today for better results.",
  };

  const result = await generator.generateTemplatesFromSegments(testSegments);

  if (result.success) {
    console.log("✅ Test passed!");
    console.log("Templates:", result.templates);
  } else {
    console.error("❌ Test failed:", result.error);
  }
}
```

## Troubleshooting

### Common Issues

1. **"Gemini API key is required"**

   - Check your `.env` file
   - Ensure the key starts with "AIza"

2. **"Invalid Gemini API key format"**

   - Get a new key from https://makersuite.google.com/app/apikey
   - Ensure it's at least 20 characters long

3. **"HTTP 429: Too Many Requests"**

   - The service handles rate limiting automatically
   - Increase `GEMINI_RATE_LIMIT_DELAY` if needed

4. **Build errors**
   - Run `npm install` and `npm run build` in the service directory
   - Check TypeScript configuration

### Debug Mode

Enable detailed logging by checking console output:

```typescript
// The service logs all operations
// Check console for detailed information about:
// - API requests
// - Processing times
// - Error details
// - Success confirmations
```

## Next Steps

1. **Test the integration** with sample data
2. **Handle errors** appropriately in your app
3. **Implement caching** if needed
4. **Monitor performance** and adjust rate limiting if necessary
5. **Add logging** to track usage and errors

The service is designed to be drop-in ready with minimal configuration required!
