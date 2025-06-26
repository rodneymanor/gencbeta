# Technical Context

## Video Processing System Technical Stack

### Core Technologies

#### Frontend
- **Next.js 15** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **React 18** with hooks and context
- **Shadcn/UI** component library

#### Backend
- **Next.js API Routes** (serverless functions)
- **Firebase Admin SDK** for server-side operations
- **Firestore** for data persistence
- **Firebase Authentication** for user management

#### External Services
- **Bunny Stream CDN** for video hosting
- **AI Transcription Services** for video analysis
- **Social Media APIs** for video downloading

### Video Processing Architecture

#### API Endpoint Structure
```
/api/
├── video/
│   ├── downloader/         # Social media video downloading
│   ├── uploader/          # CDN upload functionality  
│   ├── download-and-prepare/ # Main orchestrator
│   ├── transcribe/        # Video transcription
│   ├── analyze-complete/  # Complete AI analysis
│   ├── analyze-metadata/  # Metadata extraction
│   ├── analyze-script/    # Script analysis
│   └── analyze-visuals/   # Visual content analysis
├── download-video/        # Legacy compatibility
├── collections/           # Collection management
└── add-video-to-collection/ # External API access
```

#### Service Communication Pattern
```typescript
// Internal service calls using fetch
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/video/downloader`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url }),
});
```

### Data Models

#### Video Data Structure
```typescript
interface Video {
  id?: string;
  url: string;
  platform: string;
  thumbnailUrl: string;
  title: string;
  author: string;
  transcript: string;
  components: VideoComponents;
  contentMetadata: ContentMetadata;
  visualContext: string;
  insights: VideoInsights;
  addedAt: string;
  fileSize: number;
  duration: number;
  hostedOnCDN?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
}
```

#### Collection Data Structure
```typescript
interface Collection {
  id?: string;
  title: string;
  description: string;
  userId: string; // Coach's UID
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Transcription Response Structure
```typescript
interface TranscriptionResponse {
  success: boolean;
  transcript: string;
  platform: string;
  components: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata: {
    platform: string;
    author: string;
    description: string;
    source: string;
    hashtags: string[];
  };
  visualContext: string;
  transcriptionMetadata: {
    method: string;
    fileSize: number;
    fileName: string;
    processedAt: string;
  };
}
```

### Environment Configuration

#### Required Environment Variables
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PROJECT_ID=

# Bunny Stream CDN
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
BUNNY_CDN_HOSTNAME=

# AI Services
GEMINI_API_KEY=

# API Security
VIDEO_API_KEY=
```

#### Service Configuration Checks
```typescript
const isBunnyStreamConfigured = () => {
  return !!(
    process.env.BUNNY_STREAM_LIBRARY_ID &&
    process.env.BUNNY_STREAM_API_KEY &&
    process.env.BUNNY_CDN_HOSTNAME
  );
};
```

### Performance Optimizations

#### Background Processing Implementation
```typescript
// Fire-and-forget pattern
setTimeout(async () => {
  try {
    const formData = new FormData();
    const buffer = Buffer.from(videoData.buffer);
    const blob = new Blob([buffer], { type: videoData.mimeType });
    formData.append("video", blob, videoData.filename);

    const response = await fetch(`${baseUrl}/api/video/analyze-complete`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const analysisResult = await response.json();
      // TODO: Update video record with results
    }
  } catch (error) {
    console.error("Background analysis error:", error);
  }
}, 100); // Small delay to ensure response is sent first
```

#### CDN Upload with Fallbacks
```typescript
// Primary: Upload to Bunny Stream
if (isBunnyStreamConfigured()) {
  const cdnResult = await uploadToBunnyCDN(videoData);
  if (cdnResult) {
    return {
      cdnUrl: cdnResult.cdnUrl,
      hostedOnCDN: true
    };
  }
}

// Fallback: Return local video buffer
return {
  videoData: downloadResult.videoData,
  hostedOnCDN: false
};
```

### Database Operations

#### Firestore Transaction Pattern
```typescript
// Batch operations for consistency
const batch = writeBatch(db);

const videoRef = doc(collection(db, "videos"));
const videoData = {
  ...video,
  userId,
  collectionId: normalizedCollectionId,
  addedAt: serverTimestamp(),
};

batch.set(videoRef, videoData);

// Update collection count atomically
if (normalizedCollectionId !== "all-videos") {
  await updateCollectionVideoCount(batch, normalizedCollectionId, userId, 1);
}

await batch.commit();
```

#### Role-Based Access Control
```typescript
// RBAC service for multi-tenant access
export class CollectionsRBACService {
  static async getCollectionVideos(userId: string, collectionId?: string): Promise<Video[]> {
    const userProfile = await this.getUserProfile(userId);
    
    if (userProfile?.role === "super_admin") {
      // Super admins see all videos
      return this.getAllVideos(collectionId);
    } else if (userProfile?.role === "coach") {
      // Coaches see their own videos
      return this.getCoachVideos(userId, collectionId);
    } else if (userProfile?.role === "creator") {
      // Creators see their coach's videos
      return this.getCreatorAccessibleVideos(userProfile.assignedCoach, collectionId);
    }
    
    return [];
  }
}
```

### Error Handling & Logging

#### Service-Level Error Handling
```typescript
export async function POST(request: NextRequest) {
  console.log("📥 [DOWNLOADER] Starting video download service...");

  try {
    const { url } = await request.json();
    
    if (!url) {
      console.error("❌ [DOWNLOADER] No URL provided");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Processing logic...
    
  } catch (error) {
    console.error("❌ [DOWNLOADER] Download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
```

#### Comprehensive Logging Strategy
- **Service Prefixes**: 📥 [DOWNLOADER], 📤 [UPLOADER], 🎬 [ORCHESTRATOR]
- **Step Tracking**: Progress indicators for multi-step operations
- **Error Context**: Full error details with stack traces
- **Performance Metrics**: Timing and success/failure rates

### Security Considerations

#### API Key Authentication
```typescript
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of endpoint
}
```

#### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - read access for authenticated users
    match /user_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Collections - role-based access
    match /collections/{collectionId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/user_profiles/$(request.auth.uid)).data.role == 'super_admin');
    }
  }
}
```

### Development Tools & Workflow

#### Code Quality Tools
- **ESLint** with TypeScript rules
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for staged file linting

#### Type Safety
```typescript
// Strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```

#### Component Architecture
```typescript
// React component pattern with TypeScript
interface AddVideoDialogProps {
  collections: Array<{ id: string; title: string }>;
  selectedCollectionId?: string;
  onVideoAdded: () => void;
}

export function AddVideoDialog({ 
  collections, 
  selectedCollectionId, 
  onVideoAdded 
}: AddVideoDialogProps) {
  // Component implementation
}
```

### Deployment & Infrastructure

#### Vercel Deployment
- **Serverless Functions**: API routes auto-deploy as serverless functions
- **Environment Variables**: Managed through Vercel dashboard
- **Build Optimization**: Next.js optimizations for production

#### Firebase Integration
- **Firestore**: NoSQL database for collections and videos
- **Authentication**: User management and role-based access
- **Admin SDK**: Server-side operations with elevated permissions

#### CDN Integration
- **Bunny Stream**: Video hosting and streaming
- **HLS Support**: Adaptive bitrate streaming
- **Global Distribution**: Worldwide content delivery

### Monitoring & Analytics

#### Performance Tracking
- **Response Times**: API endpoint performance
- **Success Rates**: Video processing completion rates
- **Error Rates**: Failed operations and recovery

#### User Experience Metrics
- **Video Addition Speed**: Time from URL input to collection appearance
- **Background Processing**: Transcription completion rates
- **Error Recovery**: User-facing error resolution

### Future Technical Considerations

#### Scalability Patterns
- **Horizontal Scaling**: Independent service scaling
- **Queue Systems**: Background job processing
- **Caching Layers**: Redis for frequently accessed data

#### Real-time Features
- **WebSocket Integration**: Live progress updates
- **Server-Sent Events**: Background completion notifications
- **Optimistic Updates**: Immediate UI feedback

#### Advanced AI Integration
- **Streaming Responses**: Real-time transcription updates
- **Model Optimization**: Faster AI processing
- **Custom Models**: Domain-specific video analysis 