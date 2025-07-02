# Technical Context

## 🎉 **PRODUCTION-READY TECHNICAL STACK** (January 2, 2025)

### **Current Production Status**
- **Live Environment**: https://gencbeta-amiaxhp94-rodneymanors-projects.vercel.app
- **Last Deployment**: January 2, 2025
- **New Features**: Complete brand profile generation system with AI integration
- **Build Performance**: 55-second optimized Vercel builds
- **Status**: All features operational and verified in production

## 🎉 **NEW: Brand Profile System Technical Architecture** (January 2, 2025)

### **AI Integration Stack**

#### **Gemini 2.0 Flash Integration**
```typescript
// Brand profile generation configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 4096,
};

// Robust JSON parsing with markdown cleanup
const cleanMarkdownCodeBlocks = (text: string): string => {
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
};
```

#### **AI Response Processing**
- **Markdown Cleanup**: Handles AI responses wrapped in code blocks
- **JSON Validation**: Type-safe parsing of AI-generated content
- **Error Handling**: Comprehensive fallbacks for AI generation failures
- **Rate Limiting**: Proper API usage management

### **Database Architecture - Brand Profiles**

#### **Firestore Schema**
```typescript
interface BrandProfile {
  id: string;
  userId: string;                    // User ownership for RBAC
  questionnaire: BrandQuestionnaire; // 7-question framework
  profile: BrandProfileData;         // AI-generated strategy
  createdAt: string;                 // Firestore timestamp
  updatedAt: string;                 // Last modification
  isActive: boolean;                 // Active profile flag
  version: number;                   // Profile version tracking
}

interface BrandQuestionnaire {
  businessDescription: string;
  targetAudience: string;
  mainGoals: string;
  uniqueValue: string;
  contentTypes: string;
  brandPersonality: string;
  challenges: string;
}

interface BrandProfileData {
  contentPillars: ContentPillar[];
  keywords: KeywordStrategy;
  summary: string;
  recommendations: string[];
}
```

#### **Firestore Composite Indexes**
```json
{
  "collectionGroup": "brandProfiles",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### **Frontend Architecture - Brand Profile System**

#### **React Query Integration**
```typescript
// Optimized query configuration
const { data: profilesData, isLoading } = useQuery({
  queryKey: ["brand-profiles"],
  queryFn: () => BrandProfileService.getBrandProfiles(),
  staleTime: 5 * 60 * 1000, // 5 minutes - profiles don't change frequently
});

// Mutation with immediate UI updates
const generateProfileMutation = useMutation({
  mutationFn: (questionnaire: BrandQuestionnaire) => BrandProfileService.generateBrandProfile(questionnaire),
  onSuccess: async () => {
    // Force immediate refetch for instant UI updates
    await queryClient.refetchQueries({ queryKey: ["brand-profiles"] });
    BrandProfileService.markOnboardingComplete();
  },
});
```

#### **State Management Pattern**
```typescript
// Smart navigation with user control
const [activeTab, setActiveTab] = useState<TabValue>("questions");
const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

// One-time auto-switch to Overview after generation
useEffect(() => {
  if (hasGeneratedProfile && activeTab === "questions" && !hasAutoSwitched) {
    setActiveTab("overview");
    setHasAutoSwitched(true);
  }
  if (!hasGeneratedProfile) {
    setHasAutoSwitched(false);
  }
}, [hasGeneratedProfile, activeTab, hasAutoSwitched]);
```

### **Service Layer Architecture**

#### **BrandProfileService**
```typescript
export class BrandProfileService {
  // Authentication headers for API calls
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const idToken = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    };
  }

  // Core CRUD operations
  static async generateBrandProfile(questionnaire: BrandQuestionnaire): Promise<BrandProfile>
  static async getBrandProfiles(): Promise<{ profiles: BrandProfile[]; activeProfile: BrandProfile | null; }>
  static async updateBrandProfile(profileId: string, updates: Partial<BrandProfile>): Promise<void>
  
  // Onboarding state management
  static shouldShowOnboarding(): boolean
  static markOnboardingComplete(): void
  static setNeverShowAgain(): void
}
```

#### **API Route Structure**
```
/api/brand/
├── route.ts                 # GET: Fetch profiles, POST: Generate profile
├── activate/
│   └── route.ts            # PUT: Activate specific profile
└── [profileId]/
    └── route.ts            # PUT: Update profile, DELETE: Remove profile
```

### **UI Component Architecture**

#### **Multi-Tab Interface**
```typescript
// Tab configuration with dynamic states
const tabs = [
  { value: "overview", label: "Overview", disabled: !hasGeneratedProfile },
  { value: "questions", label: "Questions", disabled: false },
  { value: "content-pillars", label: "Content Pillars", disabled: !hasGeneratedProfile },
  { value: "keywords", label: "Keywords", disabled: !hasGeneratedProfile },
];

// Smart tab navigation component
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-4">
    {tabs.map((tab) => (
      <TabsTrigger 
        key={tab.value} 
        value={tab.value} 
        disabled={tab.disabled}
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

#### **Form Validation & Voice Input**
```typescript
// React Hook Form with Zod validation
const form = useForm<BrandQuestionnaire>({
  resolver: zodResolver(brandQuestionnaireSchema),
  defaultValues: initialValues,
});

// Voice input integration
<VoiceInput
  value={form.watch("businessDescription")}
  onChange={(value) => form.setValue("businessDescription", value)}
  placeholder="Describe your business or personal brand..."
  className="min-h-[100px]"
/>
```

### **Notification System**

#### **Context-Aware Onboarding**
```typescript
// Enhanced provider with profile awareness
export function BrandOnboardingProvider({ children }: BrandOnboardingProviderProps) {
  const { user, initializing } = useAuth();
  
  const { data: profilesData } = useQuery({
    queryKey: ["brand-profiles"],
    queryFn: () => BrandProfileService.getBrandProfiles(),
    enabled: !initializing && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const hasGeneratedProfile = Boolean(profilesData?.activeProfile?.profile);

  useEffect(() => {
    if (!initializing && user && hasGeneratedProfile) {
      // Automatically mark onboarding complete if profile exists
      BrandProfileService.markOnboardingComplete();
    }
  }, [user, initializing, hasGeneratedProfile]);
}
```

## Video Processing System Technical Stack

### Core Technologies

#### Frontend
- **Next.js 15** (App Router) - Production optimized
- **TypeScript** for type safety (95% coverage)
- **Tailwind CSS v4** for styling with Poppins typography
- **React 18** with hooks, context, and memo optimization
- **Shadcn/UI** component library with custom enhancements

#### Backend
- **Next.js API Routes** (serverless functions)
- **Firebase Admin SDK** for server-side operations
- **Firestore** for data persistence with RBAC compliance
- **Firebase Authentication** for user management and JWT validation

#### External Services
- **Bunny Stream CDN** for video hosting and iframe delivery
- **AI Transcription Services** for video analysis (Gemini integration)
- **Social Media APIs** for video downloading (TikTok/Instagram)

### **🎉 NEW: Production Video Playback Architecture** (Dec 30, 2024)

#### **Single Video Playback System**
```typescript
// VideoEmbed component with iframe recreation
interface VideoEmbedProps {
  url: string;
  className?: string;
}

const VideoEmbed = memo<VideoEmbedProps>(({ url, className = "" }) => {
  const [iframeKey, setIframeKey] = useState(0); // Force iframe recreation
  const { currentlyPlayingId } = useVideoPlaybackData();
  
  useEffect(() => {
    if (currentlyPlayingId !== videoId) {
      setIsPlaying(false);
      setIsLoading(false);
      setIframeKey((prev) => prev + 1); // Complete iframe destruction
    }
  }, [currentlyPlayingId, videoId]);
  
  // Conditional rendering for reliable state management
  return isPlaying ? 
    <iframe key={`playing-${iframeKey}`} src={playingUrl} /> :
    <ThumbnailView key={`thumb-${iframeKey}`} onClick={handlePlay} />;
});
```

#### **Security Policy Implementation**
```typescript
// Bunny.net URL validation for CSP compliance
const isBunnyUrl = (url: string) => {
  return url && (
    url.includes("iframe.mediadelivery.net") || 
    url.includes("bunnycdn.com") ||
    url.includes("b-cdn.net")
  );
};

// Reject all non-Bunny URLs with user-friendly messaging
if (!isBunnyUrl(url)) {
  return <VideoProcessingRequired />;
}
```

### **🎉 NEW: Enhanced UI Components** (Dec 30, 2024)

#### **ExpandableText Component**
```typescript
// Smart text truncation for chat interfaces
interface ExpandableTextProps {
  content: string;
  maxLines?: number;
  className?: string;
}

const ExpandableText = memo<ExpandableTextProps>(({ content, maxLines = 4 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Intelligent truncation detection
  const lines = content.split("\n");
  const needsTruncation = lines.length > maxLines || content.length > 300;
  
  if (!needsTruncation) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }
  
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {isExpanded ? content : truncatedContent}
      </p>
      <ToggleButton onClick={() => setIsExpanded(!isExpanded)} />
    </div>
  );
});
```

### Video Processing Architecture

#### API Endpoint Structure
```
/api/
├── brand/                 # 🎉 NEW: Brand profile endpoints
│   ├── route.ts          # GET/POST brand profiles
│   └── activate/         # Profile activation
├── video/
│   ├── downloader/         # Social media video downloading
│   ├── uploader/          # CDN upload functionality  
│   ├── download-and-prepare/ # Main orchestrator
│   ├── transcribe/        # Video transcription
│   ├── analyze-complete/  # Complete AI analysis
│   ├── analyze-metadata/  # Metadata extraction
│   ├── analyze-script/    # Script analysis
│   ├── analyze-visuals/   # Visual content analysis
│   └── process-and-add/   # 🎉 NEW: Complete workflow with RBAC
├── collections/           # Collection management
├── add-video-to-collection/ # External API access
└── script/
    └── speed-write/       # A/B script generation
```

#### **🎉 NEW: RBAC-Compliant Video Processing**
```typescript
// Complete video save with all required fields
POST /api/video/process-and-add
{
  url: string;
  collectionId: string;
  title?: string;
}

// Response includes all RBAC-required fields
{
  success: true;
  video: {
    id: string;
    userId: string;        // ✅ Required for RBAC ownership
    addedAt: string;       // ✅ Required for RBAC ordering
    createdAt: string;
    updatedAt: string;
    // ... other video data
  }
}
```

#### Service Communication Pattern
```typescript
// Internal service calls using fetch
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/video/downloader`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${idToken}` // ✅ Authentication required
  },
  body: JSON.stringify({ url }),
});
```

### Data Models

#### **🎉 NEW: Brand Profile Data Structure**
```typescript
interface BrandProfile {
  id: string;
  userId: string;                    // User ownership for RBAC
  questionnaire: BrandQuestionnaire; // 7-question framework
  profile: BrandProfileData;         // AI-generated strategy
  createdAt: string;                 // Firestore timestamp
  updatedAt: string;                 // Last modification
  isActive: boolean;                 // Active profile flag
  version: number;                   // Profile version tracking
}

interface BrandProfileData {
  contentPillars: ContentPillar[];
  keywords: {
    core: string[];
    audience: string[];
    problemAware: string[];
    solutionAware: string[];
  };
  hashtags: {
    broad: string[];
    niche: string[];
    community: string[];
  };
  summary: string;
  recommendations: string[];
}
```

#### **🎉 UPDATED: Video Data Structure with RBAC Fields**
```typescript
interface Video {
  id?: string;
  userId: string;           // ✅ NEW: Required for RBAC ownership
  addedAt: string;          // ✅ NEW: Required for RBAC ordering
  createdAt: string;
  updatedAt: string;
  url: string;
  iframeUrl?: string;       // Bunny.net CDN URL
  platform: string;
  thumbnailUrl: string;
  title: string;
  author: string;
  transcript: string;
  components: VideoComponents;
  contentMetadata: ContentMetadata;
  visualContext: string;
  insights: VideoInsights;
  fileSize: number;
  duration: number;
  hostedOnCDN?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    type: string;
  };
}
```

### Authentication & Authorization

#### Firebase Admin SDK Configuration
```typescript
// Server-side authentication
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

// Initialize admin SDK
const adminApp = getApps().find(app => app.name === 'admin') || 
  initializeApp(firebaseAdminConfig, 'admin');

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
```

#### JWT Token Validation
```typescript
// Authentication middleware pattern
export async function validateAuthToken(request: Request): Promise<DecodedIdToken> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  
  return decodedToken;
}
```

### Performance Optimizations

#### React Query Configuration
```typescript
// Optimized query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('auth')) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Component Memoization
```typescript
// Prevent unnecessary re-renders
const VideoEmbed = memo<VideoEmbedProps>(({ url, className = "" }) => {
  // Component implementation
});

const BrandProfileTabs = memo(() => {
  // Component implementation
});

const ExpandableText = memo<ExpandableTextProps>(({ content, maxLines = 4 }) => {
  // Component implementation
});
```

### Environment Configuration

#### Production Environment Variables
```typescript
// Required environment variables
interface EnvironmentConfig {
  // Firebase Configuration
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  
  // AI Integration
  GEMINI_API_KEY: string;
  
  // CDN Configuration
  BUNNY_STREAM_LIBRARY_ID: string;
  BUNNY_STREAM_API_KEY: string;
  BUNNY_CDN_HOSTNAME: string;
  
  // Deployment
  VERCEL_URL?: string;
  NODE_ENV: 'development' | 'production';
}
```

#### Development vs Production
```typescript
// Environment-aware configuration
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
```

### Build & Deployment

#### Next.js Configuration
```typescript
// next.config.mjs
const nextConfig = {
  experimental: {
    forceSwcTransforms: true,
  },
  images: {
    domains: ['iframe.mediadelivery.net', 'bunnycdn.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
```

#### Vercel Deployment
- **Build Time**: ~55 seconds optimized
- **Bundle Analysis**: Automatic bundle size optimization
- **Edge Functions**: Serverless API routes
- **Static Generation**: Pre-rendered pages where possible
- **Environment Variables**: Secure configuration management

### Security Implementation

#### Content Security Policy
```typescript
// CSP headers for iframe security
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      frame-src 'self' https://iframe.mediadelivery.net https://*.bunnycdn.com;
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

#### API Security
```typescript
// Rate limiting and authentication
export async function POST(request: Request) {
  try {
    // Validate authentication
    const decodedToken = await validateAuthToken(request);
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(decodedToken.uid);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }
    
    // Process request...
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
```

---

*Technical Context: Complete brand profile and video collection system with production-ready architecture, AI integration, and comprehensive security implementation* 