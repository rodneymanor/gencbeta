# Template Generator Service

A standalone service for generating reusable script templates from original content. Converts proven marketing content into generic templates that can be adapted to any subject.

## Features

✅ **Original Content Focus**: Uses real, proven content instead of synthetic generation  
✅ **Flexible Input**: Accepts both marketing segments and raw transcription text  
✅ **Batch Processing**: Process multiple inputs with rate limiting  
✅ **Comprehensive Error Handling**: Detailed error messages and logging  
✅ **TypeScript Support**: Full type safety and IntelliSense  
✅ **Zero Dependencies**: Only uses Node.js built-in modules  

## Quick Start

### Installation

```bash
# Clone or download the service
git clone <repository-url>
cd template-generator-service

# Install dependencies
npm install

# Build the service
npm run build
```

### Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Add your Gemini API key
# Get it from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=AIzaSyYourApiKeyHere
```

### Basic Usage

```typescript
import { TemplateGenerator } from './template-generator-service';

// Initialize the service
const generator = new TemplateGenerator();

// Example 1: Generate templates from marketing segments
const segments = {
  Hook: "If you want your videos to look pro, here is why you need to stop using your back camera.",
  Bridge: "Now look, before y'all start typing in the comments, let me explain why this matters.",
  "Golden Nugget": "The key insight is that proper lighting leads to better engagement when you use your front camera.",
  WTA: "So if you're ready to level up your content, switch to front camera and start seeing real growth."
};

const result = await generator.generateTemplatesFromSegments(segments);

if (result.success) {
  console.log('Generated Templates:', result.templates);
  console.log('Original Content:', result.originalContent);
  console.log('Processing Time:', result.processingTime);
} else {
  console.error('Error:', result.error);
}
```

### Output Format

```json
{
  "success": true,
  "templates": {
    "hook": "If you want to achieve [Desired Outcome], here is why you need to stop [Common Mistake].",
    "bridge": "Now look, before [Target Audience] starts [Common Reaction], let me explain why this matters.",
    "nugget": "The key insight is that [Core Principle] leads to [Specific Benefit] when you [Action Step].",
    "wta": "So if you're ready to [Desired Action], [Call to Action] and start seeing [Expected Result]."
  },
  "originalContent": {
    "Hook": "If you want your videos to look pro, here is why you need to stop using your back camera.",
    "Bridge": "Now look, before y'all start typing in the comments, let me explain why this matters.",
    "Golden Nugget": "The key insight is that proper lighting leads to better engagement when you use your front camera.",
    "WTA": "So if you're ready to level up your content, switch to front camera and start seeing real growth."
  },
  "processingTime": 2500,
  "metadata": {
    "inputType": "marketing_segments",
    "templatesGenerated": 4,
    "placeholdersIdentified": ["Desired Outcome", "Common Mistake", "Target Audience", "Core Principle"],
    "processingMode": "parallel"
  }
}
```

## Advanced Usage

### Generate from Raw Transcription

```typescript
const transcription = "If you want your videos to look pro, here is why you need to stop using your back camera. Now look, before y'all start typing in the comments, let me explain why this matters. The key insight is that proper lighting leads to better engagement when you use your front camera. So if you're ready to level up your content, switch to front camera and start seeing real growth.";

const result = await generator.generateTemplatesFromTranscription(transcription);
```

### Batch Processing

```typescript
const inputs = [
  {
    segments: {
      Hook: "First script hook...",
      Bridge: "First script bridge...",
      "Golden Nugget": "First script nugget...",
      WTA: "First script WTA..."
    }
  },
  {
    transcription: "Second script full transcription..."
  },
  {
    segments: {
      Hook: "Third script hook...",
      Bridge: "Third script bridge...",
      "Golden Nugget": "Third script nugget...",
      WTA: "Third script WTA..."
    }
  }
];

const batchResult = await generator.batchGenerateTemplates(inputs);

console.log(`Processed ${batchResult.summary.totalProcessed} inputs`);
console.log(`Success: ${batchResult.summary.successful}, Failed: ${batchResult.summary.failed}`);
```

## API Reference

### TemplateGenerator

#### Constructor
```typescript
new TemplateGenerator(apiKey?: string)
```
- `apiKey`: Optional Gemini API key. If not provided, uses `GEMINI_API_KEY` environment variable.

#### Methods

##### generateTemplatesFromSegments(segments: MarketingSegments): Promise<TemplateResult>
Generate templates from pre-analyzed marketing segments.

##### generateTemplatesFromTranscription(transcription: string): Promise<TemplateResult>
Generate templates from raw transcription text (auto-analyzes first).

##### batchGenerateTemplates(inputs: TemplateInput[]): Promise<BatchTemplateResult>
Process multiple inputs with rate limiting.

### Types

#### MarketingSegments
```typescript
interface MarketingSegments {
  Hook: string;
  Bridge: string;
  "Golden Nugget": string;
  WTA: string;
}
```

#### ScriptTemplate
```typescript
interface ScriptTemplate {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}
```

#### TemplateResult
```typescript
interface TemplateResult {
  success: boolean;
  templates?: ScriptTemplate;
  originalContent?: MarketingSegments;
  error?: string;
  processingTime: number;
  metadata?: {
    inputType: 'marketing_segments' | 'transcription';
    templatesGenerated: number;
    placeholdersIdentified: string[];
    processingMode: string;
  };
}
```

## Error Handling

The service provides comprehensive error handling:

```typescript
const result = await generator.generateTemplatesFromSegments(segments);

if (!result.success) {
  console.error('Template generation failed:', result.error);
  console.log('Processing time:', result.processingTime);
  return;
}

// Use the templates
console.log('Templates generated successfully!');
```

## Integration Examples

### Express.js API Endpoint

```typescript
import express from 'express';
import { TemplateGenerator } from './template-generator-service';

const app = express();
const generator = new TemplateGenerator();

app.post('/api/generate-templates', async (req, res) => {
  try {
    const { segments, transcription } = req.body;
    
    let result;
    if (segments) {
      result = await generator.generateTemplatesFromSegments(segments);
    } else if (transcription) {
      result = await generator.generateTemplatesFromTranscription(transcription);
    } else {
      return res.status(400).json({ error: 'Either segments or transcription is required' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Next.js API Route

```typescript
// pages/api/generate-templates.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TemplateGenerator } from '../../../template-generator-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      return res.status(400).json({ error: 'Either segments or transcription is required' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | Required | Your Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model to use |
| `GEMINI_TIMEOUT` | `30000` | Request timeout in milliseconds |
| `GEMINI_RATE_LIMIT_DELAY` | `500` | Delay between requests in milliseconds |

### Rate Limiting

The service automatically implements rate limiting:
- 500ms delay between requests
- 30-second timeout per request
- Configurable via environment variables

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Clean Build
```bash
npm run clean && npm run build
```

## Troubleshooting

### Common Issues

1. **"Gemini API key is required"**
   - Set the `GEMINI_API_KEY` environment variable
   - Or pass the API key to the constructor

2. **"Invalid Gemini API key format"**
   - Ensure your API key starts with "AIza"
   - Get a new key from https://makersuite.google.com/app/apikey

3. **"HTTP 429: Too Many Requests"**
   - The service automatically handles rate limiting
   - Increase `GEMINI_RATE_LIMIT_DELAY` if needed

4. **"Failed to parse JSON response"**
   - Usually indicates an issue with the Gemini API response
   - Check your API key and quota

### Debug Mode

Enable detailed logging by setting the log level:

```typescript
// The service logs all operations to console
// Check the console output for detailed information
```

## License

MIT License - see LICENSE file for details. 