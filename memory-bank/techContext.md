# Technical Context

## 🎉 **NEW: Video Collection System Technical Architecture** (January 2025)

### **Video Management Stack**

#### **Video Playback Management Architecture**

```typescript
// Core video management with single video enforcement
export function useVideoManager() {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const playVideo = useCallback(
    (videoId: string) => {
      // Stop any currently playing video
      if (playingVideoId && playingVideoId !== videoId) {
        setIframeKey((prev) => prev + 1);
      }
      setPlayingVideoId(videoId);
    },
    [playingVideoId],
  );

  const stopVideo = useCallback(() => {
    setPlayingVideoId(null);
    setIframeKey((prev) => prev + 1);
  }, []);

  return { playingVideoId, iframeKey, playVideo, stopVideo };
}
```

#### **HLS Buffer Monitoring System**

```typescript
// Real-time buffer health monitoring
export function useHLSBufferMonitor(videoRef: RefObject<HTMLVideoElement>) {
  const [bufferHealth, setBufferHealth] = useState<BufferHealth>("healthy");
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const maxRecoveryAttempts = 3;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const checkBufferHealth = () => {
      const buffered = video.buffered;
      const currentTime = video.currentTime;

      let isBuffered = false;
      for (let i = 0; i < buffered.length; i++) {
        if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
          isBuffered = true;
          break;
        }
      }

      if (!isBuffered && bufferHealth === "healthy") {
        setBufferHealth("stalled");
        setRecoveryAttempts((prev) => prev + 1);
      } else if (isBuffered && bufferHealth === "stalled") {
        setBufferHealth("healthy");
      }
    };

    const interval = setInterval(checkBufferHealth, 1000);
    return () => clearInterval(interval);
  }, [videoRef, bufferHealth]);

  return { bufferHealth, recoveryAttempts };
}
```

#### **Browser-Specific Video Handling**

```typescript
// Cross-browser compatibility management
export function useBrowserSpecificVideo() {
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsFirefox(userAgent.includes("Firefox"));
  }, []);

  const getVideoStrategy = useCallback(() => {
    if (isFirefox) {
      return {
        preload: "none",
        useSingleIframe: true,
        postMessageControl: true,
      };
    }

    return {
      preload: "metadata",
      useSingleIframe: false,
      postMessageControl: true,
    };
  }, [isFirefox]);

  return { isFirefox, getVideoStrategy };
}
```

### **Thumbnail System Architecture**

#### **CDN Integration with Bunny.net**

```typescript
// Proper thumbnail URL generation
export function generateThumbnailUrl(videoId: string, width: number = 320): string {
  const cleanVideoId = videoId.replace(/[^a-zA-Z0-9-]/g, '');
  return `https://iframe.mediadelivery.net/${cleanVideoId}/${width}`;
}

// VideoEmbed component with thumbnail support
export function VideoEmbed({ videoId, isPlaying, onPlay }: VideoEmbedProps) {
  const thumbnailUrl = generateThumbnailUrl(videoId);
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <div className="relative aspect-video">
      {isPlaying ? (
        <iframe
          src={`https://iframe.mediadelivery.net/embed/${videoId}`}
          className="w-full h-full"
          allowFullScreen
        />
      ) : (
        <div
          className="w-full h-full bg-cover bg-center cursor-pointer"
          style={{
            backgroundImage: thumbnailError ? 'none' : `url(${thumbnailUrl})`
          }}
          onClick={onPlay}
          onError={() => setThumbnailError(true)}
        >
          {thumbnailError && (
            <div className="flex items-center justify-center h-full bg-muted">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### **UI Component Architecture**

#### **Z-Index Management System**

```typescript
// Conflict resolution for overlapping elements
export function VideoCard({ video, isManagementMode, onSelect }: VideoCardProps) {
  return (
    <div className="relative group">
      <VideoEmbed videoId={video.id} />

      {/* Management mode checkbox - z-10 */}
      {isManagementMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selectedVideos.includes(video.id)}
            onCheckedChange={(checked) => onSelect(video.id, checked)}
          />
        </div>
      )}

      {/* Three dots menu - z-50 */}
      {!isManagementMode && (
        <VideoActionsDropdown
          video={video}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}

// VideoActionsDropdown with proper z-index
export function VideoActionsDropdown({ video, onDelete, onEdit }: VideoActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 z-50 bg-black/20 hover:bg-black/30 text-white border-0 p-1 h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-50">
        <DropdownMenuItem onClick={() => onEdit(video)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(video.id)}>
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### **Performance Optimization Architecture**

#### **Lazy Loading and Preloading Strategy**

```typescript
// Performance optimization for video components
export function useVideoPerformance() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Preload strategy based on browser
  useEffect(() => {
    if (isVisible && !isPreloaded) {
      const userAgent = navigator.userAgent;
      const isFirefox = userAgent.includes("Firefox");

      if (!isFirefox) {
        // Preload metadata for non-Firefox browsers
        setIsPreloaded(true);
      }
    }
  }, [isVisible, isPreloaded]);

  return { isVisible, isPreloaded, videoRef };
}
```

### **Error Handling and Recovery**

#### **Comprehensive Error Management**

```typescript
// Error handling for video operations
export function useVideoErrorHandling() {
  const [errors, setErrors] = useState<VideoError[]>([]);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  const handleVideoError = useCallback(
    (error: VideoError) => {
      setErrors((prev) => [...prev, error]);

      // Attempt recovery for certain error types
      if (error.type === "buffer_stall" && recoveryAttempts < 3) {
        setRecoveryAttempts((prev) => prev + 1);
        // Trigger recovery logic
      }
    },
    [recoveryAttempts],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
    setRecoveryAttempts(0);
  }, []);

  return { errors, recoveryAttempts, handleVideoError, clearErrors };
}
```

## 🎉 **PRODUCTION-READY TECHNICAL STACK** (January 2, 2025)

### **Current Production Status**

- **Live Environment**: https://gencbeta-amiaxhp94-rodneymanors-projects.vercel.app
- **Last Deployment**: January 2, 2025
- **Latest Features**: Complete usage tracking system with credit management
- **Build Performance**: 55-second optimized Vercel builds
- **Status**: All features operational and verified in production

## 🎉 **NEW: Usage Tracking System Technical Architecture** (January 2, 2025)

### **Credit Management Stack**

#### **CreditsService Class Architecture**

```typescript
export class CreditsService {
  private static readonly COLLECTIONS = {
    USER_CREDITS: "user_credits",
    CREDIT_TRANSACTIONS: "credit_transactions",
    USAGE_TRACKING: "usage_tracking",
  } as const;

  private static readonly CREDIT_COSTS: Record<CreditOperation, number> = {
    SCRIPT_GENERATION: 1,
    VOICE_TRAINING: 80,
    VIDEO_ANALYSIS: 1,
    API_REQUEST: 1,
    COLLECTION_ADD: 1,
  };

  private static readonly ACCOUNT_LIMITS: Record<AccountLevel, AccountLimits> = {
    free: { dailyLimit: 3, monthlyLimit: null, resetPeriod: "daily" },
    pro: { dailyLimit: null, monthlyLimit: 5000, resetPeriod: "monthly" },
  };
}
```

#### **Database Schema - Usage Tracking**

```typescript
interface UserCredits {
  id?: string;
  userId: string;
  accountLevel: "free" | "pro";
  creditsUsed: number;
  creditsLimit: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  dailyCreditsUsed?: number; // Free users only
  monthlyCreditsUsed?: number; // Pro users only
  totalCreditsUsed: number;
  totalScriptsGenerated: number;
  totalVoicesCreated: number;
  totalVideosProcessed: number;
  createdAt: string;
  updatedAt: string;
}

interface CreditTransaction {
  id?: string;
  userId: string;
  creditsUsed: number;
  operation: CreditOperation;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface UsageTracking {
  id?: string;
  userId: string;
  operation: CreditOperation;
  creditsUsed: number;
  timestamp: string;
  metadata: Record<string, unknown>;
  accountLevel: AccountLevel;
}
```

#### **Firestore Collections & Indexes**

```json
{
  "indexes": [
    {
      "collectionGroup": "user_credits",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "accountLevel", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "credit_transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "usage_tracking",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "operation", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### **Real-Time UI Architecture**

#### **UsageTracker Component**

```typescript
export function UsageTracker() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUsageStats = useCallback(async () => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/usage/stats", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsageStats();

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchUsageStats, 30000);
    return () => clearInterval(interval);
  }, [fetchUsageStats]);
}
```

#### **SocialStats Carousel Component**

```typescript
export function SocialStats() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [socialStats] = useState<SocialMediaStats[]>(mockSocialStats);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (socialStats.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % socialStats.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [socialStats.length]);

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
}
```

### **API Integration Architecture**

#### **Credit Enforcement in Speed-Write API**

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return createErrorResponse(authResult.error, 401);
    }

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return createErrorResponse(rateLimitResult.reason ?? "Rate limit exceeded", 429);
    }

    // 3. Credit availability check
    const creditCheck = await CreditsService.canPerformAction(userId, "SCRIPT_GENERATION", accountLevel);
    if (!creditCheck.canPerform) {
      return createErrorResponse(creditCheck.reason ?? "Insufficient credits", 402);
    }

    // 4. Process operation
    const { speedWriteResult, educationalResult } = await processSpeedWriteRequest(body, userId);

    // 5. Deduct credits on success
    if (speedWriteResult || educationalResult) {
      await CreditsService.trackUsageAndDeductCredits(userId, "SCRIPT_GENERATION", accountLevel, {
        prompt: body.prompt,
        optionA: !!speedWriteResult,
        optionB: !!educationalResult,
      });
    }

    return NextResponse.json({ success: true, optionA: speedWriteResult, optionB: educationalResult });
  } catch (error) {
    console.error("🚨 Speed-write API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
```

#### **Usage Stats API Endpoint**

```typescript
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return createErrorResponse(authResult.error, 401);
    }

    const { userId, accountLevel } = authResult;
    const usageStats = await CreditsService.getUsageStats(userId, accountLevel);

    return NextResponse.json(usageStats);
  } catch (error) {
    console.error("🚨 Usage stats API error:", error);
    return createErrorResponse("Failed to fetch usage stats", 500);
  }
}
```

### **Firebase SDK Usage Patterns**

#### **Critical SDK Context Rule**

```typescript
// ✅ CORRECT - Client SDK in React components
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

export function MyComponent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Client SDK with user context
      const unsubscribe = onSnapshot(collection(db, "user_data"), (snapshot) => {
        // Handle real-time updates
      });
      return unsubscribe;
    }
  }, [user]);
}

// ✅ CORRECT - Admin SDK in API routes
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  // Admin SDK with elevated permissions
  const snapshot = await adminDb.collection("user_credits").get();
  return NextResponse.json(snapshot.docs.map((doc) => doc.data()));
}
```

#### **SDK Selection Matrix**

| Context          | SDK    | Import                 | Use Case                                     |
| ---------------- | ------ | ---------------------- | -------------------------------------------- |
| React Components | Client | `@/lib/firebase`       | Real-time subscriptions, user-scoped queries |
| Custom Hooks     | Client | `@/lib/firebase`       | Authentication state, user data              |
| API Routes       | Admin  | `@/lib/firebase-admin` | Server-side operations, elevated permissions |
| Middleware       | Admin  | `@/lib/firebase-admin` | Authentication verification                  |
| Server Actions   | Admin  | `@/lib/firebase-admin` | Server-side mutations                        |

### **Layout & Component Architecture**

#### **Updated Application Layout Structure**

```typescript
// Header layout with SocialStats
<header className="flex items-center justify-between p-4">
  <div className="flex items-center gap-4">
    <AppLogo />
    <Navigation />
  </div>

  <div className="flex items-center gap-4">
    <SocialStats />           {/* Auto-rotating carousel */}
    <AccountBadge />          {/* Free/Pro indicator */}
    <UserProfileDropdown />   {/* User menu */}
  </div>
</header>

// Sidebar footer with UsageTracker
<div className="mt-auto space-y-4">
  <UsageTracker />           {/* Credit display with progress */}
  <UserProfileSection />     {/* User info */}
  <SettingsButton />         {/* Settings gear */}
</div>
```

#### **Component Hierarchy**

```
Dashboard Layout
├── Header
│   ├── SocialStats (carousel)
│   ├── AccountBadge (Free/Pro)
│   └── UserProfileDropdown
├── Sidebar
│   ├── Navigation (main content)
│   └── Footer
│       ├── UsageTracker (credits)
│       ├── UserProfileSection
│       └── SettingsButton
└── Main Content Area
```

## 🎉 **PREVIOUSLY DOCUMENTED: Brand Profile System Technical Architecture** (January 2, 2025)

### **AI Integration Stack**

#### **Gemini 2.0 Flash Integration**

````typescript
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
  return text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
};
````

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
  userId: string; // User ownership for RBAC
  questionnaire: BrandQuestionnaire; // 7-question framework
  profile: BrandProfileData; // AI-generated strategy
  createdAt: string; // Firestore timestamp
  updatedAt: string; // Last modification
  isActive: boolean; // Active profile flag
  version: number; // Profile version tracking
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
      Authorization: `Bearer ${idToken}`,
    };
  }

  // Core CRUD operations
  static async generateBrandProfile(questionnaire: BrandQuestionnaire): Promise<BrandProfile>;
  static async getBrandProfiles(): Promise<{ profiles: BrandProfile[]; activeProfile: BrandProfile | null }>;
  static async updateBrandProfile(profileId: string, updates: Partial<BrandProfile>): Promise<void>;

  // Onboarding state management
  static shouldShowOnboarding(): boolean;
  static markOnboardingComplete(): void;
  static setNeverShowAgain(): void;
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
const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/video/downloader`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`, // ✅ Authentication required
  },
  body: JSON.stringify({ url }),
});
```

### Data Models

#### **🎉 NEW: Brand Profile Data Structure**

```typescript
interface BrandProfile {
  id: string;
  userId: string; // User ownership for RBAC
  questionnaire: BrandQuestionnaire; // 7-question framework
  profile: BrandProfileData; // AI-generated strategy
  createdAt: string; // Firestore timestamp
  updatedAt: string; // Last modification
  isActive: boolean; // Active profile flag
  version: number; // Profile version tracking
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
  userId: string; // ✅ NEW: Required for RBAC ownership
  addedAt: string; // ✅ NEW: Required for RBAC ordering
  createdAt: string;
  updatedAt: string;
  url: string;
  iframeUrl?: string; // Bunny.net CDN URL
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
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
};

// Initialize admin SDK
const adminApp = getApps().find((app) => app.name === "admin") || initializeApp(firebaseAdminConfig, "admin");

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
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("auth")) {
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
  NODE_ENV: "development" | "production";
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

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
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
    domains: ["iframe.mediadelivery.net", "bunnycdn.com"],
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
    key: "Content-Security-Policy",
    value: `
      frame-src 'self' https://iframe.mediadelivery.net https://*.bunnycdn.com;
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
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
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Process request...
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
```

---

_Technical Context: Complete brand profile and video collection system with production-ready architecture, AI integration, and comprehensive security implementation_
