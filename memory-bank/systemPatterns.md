# System Patterns

## 🎉 **NEW: Video Collection System Architecture** (January 2025)

### Video Playback Management Pattern

#### **Single Video Enforcement System**

**Problem**: Multiple videos playing simultaneously when switching between videos.
**Solution**: Comprehensive video management with cross-browser compatibility.

```typescript
// Video management hook with single video enforcement
export function useVideoManager() {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const playVideo = useCallback(
    (videoId: string) => {
      // Stop any currently playing video
      if (playingVideoId && playingVideoId !== videoId) {
        // Force iframe recreation for reliable stopping
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

#### **Benefits of Single Video Enforcement**

- **Reliable Control**: Only one video plays at a time across all pages
- **Cross-Browser Support**: Works consistently in Chrome, Safari, Firefox
- **Performance Optimized**: Prevents resource conflicts and memory issues
- **User Experience**: Clear, predictable video behavior

### HLS Buffer Monitoring Pattern

#### **Multi-Layered Buffer Health System**

**Problem**: HLS videos can stall or buffer unexpectedly, causing poor user experience.
**Solution**: Real-time buffer monitoring with automatic recovery.

```typescript
// Comprehensive buffer monitoring with recovery
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

      // Check if current time is buffered
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

  const attemptRecovery = useCallback(() => {
    if (recoveryAttempts < maxRecoveryAttempts) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = video.currentTime + 0.1;
        setRecoveryAttempts((prev) => prev + 1);
      }
    }
  }, [recoveryAttempts, videoRef]);

  return { bufferHealth, recoveryAttempts, attemptRecovery };
}
```

#### **Benefits of Buffer Monitoring**

- **Real-Time Detection**: Immediate identification of buffer issues
- **Automatic Recovery**: Self-healing system for stalled videos
- **Performance Tracking**: Monitor video performance over time
- **User Feedback**: Clear indicators of video health status

### Browser-Specific Video Handling Pattern

#### **Firefox Video Management**

**Problem**: Firefox has different video behavior that can cause multiple videos to play.
**Solution**: Browser-specific handling with specialized strategies.

```typescript
// Browser detection and specialized handling
export function useBrowserSpecificVideo() {
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsFirefox(userAgent.includes("Firefox"));
  }, []);

  const getVideoStrategy = useCallback(() => {
    if (isFirefox) {
      return {
        preload: "none", // Disable preloading in Firefox
        useSingleIframe: true, // Use single iframe with dynamic source
        postMessageControl: true, // Rely on postMessage for control
      };
    }

    return {
      preload: "metadata", // Enable preloading in other browsers
      useSingleIframe: false, // Allow iframe recreation
      postMessageControl: true, // Use postMessage for control
    };
  }, [isFirefox]);

  return { isFirefox, getVideoStrategy };
}
```

#### **Benefits of Browser-Specific Handling**

- **Cross-Browser Compatibility**: Consistent behavior across all browsers
- **Performance Optimization**: Browser-specific optimizations
- **Reliability**: Reduced video playback issues
- **Maintainability**: Clear separation of browser-specific logic

### Thumbnail System Pattern

#### **CDN Integration with Fallback**

**Problem**: Thumbnails not displaying due to incorrect CDN URL format.
**Solution**: Proper URL generation with fallback handling.

```typescript
// Proper Bunny.net thumbnail URL generation
export function generateThumbnailUrl(videoId: string, width: number = 320): string {
  // Ensure videoId is properly formatted
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
            backgroundImage: thumbnailError
              ? 'none'
              : `url(${thumbnailUrl})`
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

#### **Benefits of Thumbnail System**

- **Reliable Display**: Proper CDN integration with error handling
- **Performance**: Fast thumbnail loading with fallbacks
- **User Experience**: Clear visual indicators for video content
- **Accessibility**: Proper alt text and click targets

### UI Component Z-Index Management Pattern

#### **Conflict Resolution for Overlapping Elements**

**Problem**: Z-index conflicts between management mode checkbox and three dots menu.
**Solution**: Proper layering and conditional rendering.

```typescript
// Fixed z-index management for video actions
export function VideoCard({ video, isManagementMode, onSelect }: VideoCardProps) {
  return (
    <div className="relative group">
      {/* Video content */}
      <VideoEmbed videoId={video.id} />

      {/* Management mode checkbox - only when in management mode */}
      {isManagementMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selectedVideos.includes(video.id)}
            onCheckedChange={(checked) => onSelect(video.id, checked)}
          />
        </div>
      )}

      {/* Three dots menu - only when NOT in management mode */}
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

#### **Benefits of Z-Index Management**

- **Conflict Resolution**: Eliminates overlapping element issues
- **User Experience**: Reliable button interaction
- **Visual Clarity**: Clear hierarchy of interactive elements
- **Maintainability**: Organized component structure

## 🎉 **PREVIOUSLY DOCUMENTED: Production-Ready Usage Tracking System** (January 2, 2025)

### Credit-Based Usage Management Architecture

#### **CreditsService Class Pattern**

**Problem**: Need comprehensive credit management with real-time tracking and enforcement.
**Solution**: Centralized service class with atomic transactions and period management.

```typescript
export class CreditsService {
  private static readonly COLLECTIONS = {
    USER_CREDITS: "user_credits",
    CREDIT_TRANSACTIONS: "credit_transactions",
    USAGE_TRACKING: "usage_tracking",
  } as const;

  // Core credit operations with automatic period reset
  static async getUserCredits(userId: string, accountLevel: AccountLevel): Promise<UserCredits> {
    const userCredits = await this.fetchUserCredits(userId);

    // Check if period reset is needed
    const needsReset = await this.checkAndResetPeriod(userCredits, accountLevel);
    if (needsReset) {
      return this.getUserCredits(userId, accountLevel); // Recurse after reset
    }

    return userCredits;
  }

  // Atomic credit deduction with transaction logging
  static async deductCredits(userId: string, operation: CreditOperation, accountLevel: AccountLevel) {
    const batch = adminDb.batch();

    // Update user credits
    const userCreditsRef = adminDb.collection(this.COLLECTIONS.USER_CREDITS).doc(userCredits.id!);
    batch.update(userCreditsRef, updateData);

    // Add transaction record
    const transactionRef = adminDb.collection(this.COLLECTIONS.CREDIT_TRANSACTIONS).doc();
    batch.set(transactionRef, transaction);

    await batch.commit(); // Atomic operation
  }
}
```

#### **Benefits of CreditsService Pattern**

- **Atomic Operations**: Firestore batches ensure data consistency
- **Automatic Resets**: Period management handles daily/monthly resets
- **Comprehensive Tracking**: Detailed transaction logs for analytics
- **Account Level Support**: Different limits for free vs pro users

### Real-Time UI Update Pattern

#### **UsageTracker Component with Auto-Refresh**

**Problem**: Users need real-time feedback on credit usage without manual refresh.
**Solution**: Auto-refreshing component with color-coded progress indicators.

```typescript
export function UsageTracker() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  const fetchUsageStats = async () => {
    const response = await fetch("/api/usage/stats", {
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    const data = await response.json();
    setUsageStats(data);
  };

  useEffect(() => {
    fetchUsageStats();

    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchUsageStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Color-coded progress bar based on usage percentage
  const isLowCredits = usageStats.percentageUsed >= 80;
  const isOutOfCredits = usageStats.creditsRemaining === 0;
}
```

#### **Benefits of Real-Time Updates**

- **Immediate Feedback**: Users see credit changes within 30 seconds
- **Visual Indicators**: Color-coded progress bars (green/yellow/red)
- **Automatic Refresh**: No manual interaction required
- **Performance Optimized**: Only updates when user is active

### API Credit Enforcement Pattern

#### **Pre-flight Credit Checking with Deduction**

**Problem**: Need to enforce credit limits before expensive operations.
**Solution**: Check credits before processing, deduct after successful completion.

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const authResult = await authenticateApiKey(request);

  // 2. Check rate limiting
  if (!rateLimitResult.allowed) {
    return createErrorResponse(rateLimitResult.reason ?? "Rate limit exceeded", 429);
  }

  // 3. Check credit availability BEFORE processing
  const creditCheck = await CreditsService.canPerformAction(userId, "SCRIPT_GENERATION", accountLevel);
  if (!creditCheck.canPerform) {
    return createErrorResponse(creditCheck.reason ?? "Insufficient credits", 402);
  }

  // 4. Process expensive operation
  const { speedWriteResult, educationalResult } = await processSpeedWriteRequest(body, userId);

  // 5. Deduct credits ONLY on success
  if (optionA || optionB) {
    await CreditsService.trackUsageAndDeductCredits(userId, "SCRIPT_GENERATION", accountLevel, usageData);
  }

  return NextResponse.json({ success: true, optionA, optionB });
}
```

#### **Benefits of Credit Enforcement Pattern**

- **Pre-flight Validation**: Prevents expensive operations without credits
- **Success-Based Deduction**: Only charges for successful operations
- **Proper HTTP Status**: 402 Payment Required for insufficient credits
- **Atomic Tracking**: Single call for deduction and usage logging

### Social Media Stats Carousel Pattern

#### **Auto-Rotating Component with Manual Control**

**Problem**: Display multiple social media stats in limited header space.
**Solution**: Auto-rotating carousel with manual navigation controls.

```typescript
export function SocialStats() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [socialStats] = useState<SocialMediaStats[]>(mockSocialStats);

  // Auto-rotate through platforms every 5 seconds
  useEffect(() => {
    if (socialStats.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % socialStats.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [socialStats.length]);

  const currentStat = socialStats[currentIndex];
  const isPositiveChange = currentStat.weeklyChange > 0;

  return (
    <Card className="min-w-[200px]">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Platform info + follower count + weekly change */}
          <div className="flex items-center gap-3">
            <span>{getPlatformIcon(currentStat.platform)}</span>
            <span>{formatFollowerCount(currentStat.followerCount)} followers</span>
            {getTrendIcon(isPositiveChange)}
            <span className={getChangeColor(isPositiveChange)}>
              {formatChange(currentStat.weeklyChange)}
            </span>
          </div>
        </div>

        {/* Platform indicators */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {socialStats.map((_, index) => (
            <div className={`h-1 w-1 rounded-full ${index === currentIndex ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **Benefits of Carousel Pattern**

- **Space Efficient**: Multiple stats in compact header space
- **Auto-Rotation**: Passive information display every 5 seconds
- **Manual Control**: Users can navigate manually if needed
- **Visual Indicators**: Clear platform indicators and trend arrows

## 🎉 **PREVIOUSLY DOCUMENTED: Brand Profile System Architecture** (January 2, 2025)

### AI-Powered Brand Profile Generation

#### **Gemini 2.0 Flash Integration Pattern**

**Problem**: Generate comprehensive brand strategies from user questionnaires.
**Solution**: Robust AI integration with JSON parsing and error handling.

````typescript
// Brand profile generation with markdown cleanup
const generateProfileWithGemini = async (questionnaire: BrandQuestionnaire): Promise<BrandProfileData> => {
  const prompt = constructBrandProfilePrompt(questionnaire);

  const result = await genAI.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });

  // Critical: Clean markdown code blocks from AI response
  const cleanMarkdownCodeBlocks = (text: string): string => {
    return text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
  };

  const cleanedResponse = cleanMarkdownCodeBlocks(result.response.text());
  const profileData = JSON.parse(cleanedResponse);

  return profileData;
};
````

#### **Benefits of Markdown Cleanup Pattern**

- **Robust Parsing**: Handles AI responses wrapped in markdown code blocks
- **Error Prevention**: Prevents JSON.parse failures from markdown formatting
- **Consistent Output**: Ensures clean JSON regardless of AI response format
- **Production Reliability**: Tested with Gemini 2.0 Flash responses

### React Query Optimization Pattern

#### **Immediate UI Updates with Refetch Strategy**

**Problem**: `invalidateQueries` doesn't immediately update UI after mutations.
**Solution**: Use `refetchQueries` with async/await for instant data refresh.

```typescript
// Optimized mutation pattern for immediate UI updates
const generateProfileMutation = useMutation({
  mutationFn: (questionnaire: BrandQuestionnaire) => BrandProfileService.generateBrandProfile(questionnaire),
  onSuccess: async () => {
    toast.success("Brand profile generated successfully!");
    // Force immediate refetch for instant UI updates
    await queryClient.refetchQueries({ queryKey: ["brand-profiles"] });
    // Mark onboarding complete to stop notifications
    BrandProfileService.markOnboardingComplete();
    onProfileGenerated();
  },
  onError: (error) => {
    toast.error("Failed to generate brand profile", {
      description: error instanceof Error ? error.message : "Please try again",
    });
  },
});
```

#### **Benefits of Refetch Strategy**

- **Immediate Updates**: UI reflects changes instantly without waiting for cache invalidation
- **Predictable Timing**: Async/await ensures proper sequencing of operations
- **User Experience**: No delay between action completion and UI update
- **Consistency**: Same pattern applied across all brand profile mutations

### Smart Navigation Pattern

#### **Tab Auto-Switching with User Control**

**Problem**: Auto-switching to Overview tab after generation prevented manual navigation back to Questions.
**Solution**: One-time auto-switch with state flag to preserve user control.

```typescript
// Smart navigation with user control preservation
export function BrandProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabValue>("questions");
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  // Auto-switch to overview tab after generation (only once)
  useEffect(() => {
    if (hasGeneratedProfile && activeTab === "questions" && !hasAutoSwitched) {
      setActiveTab("overview");
      setHasAutoSwitched(true);
    }
    // Reset auto-switch flag when profile is removed
    if (!hasGeneratedProfile) {
      setHasAutoSwitched(false);
    }
  }, [hasGeneratedProfile, activeTab, hasAutoSwitched]);
}
```

#### **Benefits of Smart Navigation**

- **One-Time Auto-Switch**: Automatically shows generated profile once
- **User Control**: Allows manual navigation after initial auto-switch
- **State Management**: Tracks auto-switch state to prevent continuous switching
- **Reset Capability**: Resets behavior when profile is removed

### Context-Aware Notification Pattern

#### **Profile-Based Notification Control**

**Problem**: Onboarding notifications continued showing after profile completion.
**Solution**: Check actual profile existence, not just localStorage state.

```typescript
// Enhanced notification provider with profile awareness
export function BrandOnboardingProvider({ children }: BrandOnboardingProviderProps) {
  const { user, initializing } = useAuth();

  // Fetch brand profiles to check if user has one
  const { data: profilesData } = useQuery({
    queryKey: ["brand-profiles"],
    queryFn: () => BrandProfileService.getBrandProfiles(),
    enabled: !initializing && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const hasGeneratedProfile = Boolean(profilesData?.activeProfile?.profile);

  useEffect(() => {
    if (!initializing && user) {
      // If user has a generated profile, mark onboarding as complete
      if (hasGeneratedProfile) {
        BrandProfileService.markOnboardingComplete();
        return;
      }

      const shouldShow = BrandProfileService.shouldShowOnboarding();
      if (shouldShow) {
        // Show notification logic...
      }
    }
  }, [user, initializing, hasGeneratedProfile]);
}
```

#### **Benefits of Context-Aware Notifications**

- **Real State Checking**: Verifies actual profile existence, not just localStorage
- **Automatic Completion**: Marks onboarding complete when profile exists
- **Dual Protection**: Both provider-level and generation-level safeguards
- **User Experience**: Stops notifications immediately after profile creation

### Firestore Composite Index Pattern

#### **Complex Query Index Configuration**

**Problem**: Queries filtering by `userId` and ordering by `createdAt` require composite indexes.
**Solution**: Proper index configuration in `firestore.indexes.json`.

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

#### **Query Pattern Requiring Index**

```typescript
// Firestore query requiring composite index
const profilesSnapshot = await adminDb
  .collection("brandProfiles")
  .where("userId", "==", userId) // Filter by user
  .orderBy("createdAt", "desc") // Order by creation time
  .get();
```

#### **Benefits of Proper Indexing**

- **Query Performance**: Enables efficient filtering and ordering
- **Error Prevention**: Prevents `FAILED_PRECONDITION` errors
- **Scalability**: Supports large datasets with proper index optimization
- **RBAC Compliance**: Enables user-scoped data access patterns

## 🔥 **CRITICAL: Firebase SDK Usage Patterns** (January 2, 2025)

### Client vs Admin SDK Context Rule

#### **The Critical Learning**

**Problem**: Usage tracking failed with "Permission Denied" errors because we used client SDK in API routes.
**Root Cause**: Client SDK requires user authentication context, which doesn't exist in server-side API routes.

#### **The Golden Rule**

**Always match Firebase SDK to execution context:**

- **Client-Side (React components, hooks)** → Client SDK (`@/lib/firebase`)
- **Server-Side (API routes, middleware)** → Admin SDK (`@/lib/firebase-admin`)

#### **Usage Tracking Implementation Pattern**

```typescript
// ❌ WRONG - Client SDK in API route causes permission errors
import { db } from "@/lib/firebase";
await addDoc(collection(db, "usage_tracking"), data); // FAILS

// ✅ CORRECT - Admin SDK in API route
import { adminDb } from "@/lib/firebase-admin";
await adminDb.collection("usage_tracking").add(data); // WORKS
```

#### **File Organization Pattern**

For services needing both contexts:

- `usage-tracker.ts` → Client version (React components)
- `usage-tracker-admin.ts` → Server version (API routes)

#### **Business Impact**

Usage tracking is critical for:

- Customer billing (AI API costs per user)
- Rate limiting and abuse prevention
- Cost attribution and pricing strategy
- Feature usage analytics

**Documentation**: See `docs/firebase-sdk-usage-patterns.md` for complete guide.

## Video Processing Microservices Architecture

### Overview

The video processing system follows a microservice architecture with clear separation of concerns, orchestration patterns, and graceful fallbacks.

## 🎉 **NEW: Production Video Playback Patterns** (Dec 30, 2024)

### Single Video Playback Control Strategy

#### **Iframe Recreation Pattern**

**Problem**: Multiple Bunny.net iframes playing simultaneously when switching videos.
**Solution**: Complete iframe lifecycle management with forced recreation.

```typescript
// VideoEmbed component pattern
const VideoEmbed = memo<VideoEmbedProps>(({ url, className = "" }) => {
  const [iframeKey, setIframeKey] = useState(0); // Force iframe recreation
  const { currentlyPlayingId } = useVideoPlaybackData();
  const videoId = url || "unknown";

  useEffect(() => {
    if (currentlyPlayingId !== videoId) {
      setIsPlaying(false);
      setIsLoading(false);
      // Force iframe to be completely destroyed and recreated
      setIframeKey((prev) => prev + 1);
    }
  }, [currentlyPlayingId, videoId, isPlaying]);

  // Conditional rendering for thumbnail vs playing states
  if (!isPlaying) {
    return (
      <div onClick={handlePlay}>
        <iframe key={`thumbnail-${iframeKey}`} src={thumbnailUrl} />
        <PlayButton />
      </div>
    );
  }

  return <iframe key={`playing-${iframeKey}`} src={playingUrl} />;
});
```

#### **Benefits of Iframe Recreation**

- **Guaranteed Pause**: Complete iframe destruction ensures no background playback
- **React-Controlled**: Leverages React's component lifecycle for reliable state management
- **Cross-Origin Safe**: Works with Bunny.net CDN without requiring postMessage API
- **Production Tested**: Verified working across all collection pages

### Bunny.net Security Policy Pattern

#### **Strict URL Validation**

**Security Requirement**: Prevent direct social media embedding causing CSP violations.
**Implementation**: Whitelist-only approach for video URLs.

```typescript
// URL validation pattern
const isBunnyUrl = (url: string) => {
  return url && (
    url.includes("iframe.mediadelivery.net") ||
    url.includes("bunnycdn.com") ||
    url.includes("b-cdn.net")
  );
};

// VideoEmbed security enforcement
if (!isBunnyUrl(url)) {
  return (
    <div className="video-security-warning">
      <AlertTriangle className="text-yellow-500" />
      <p>Video Processing Required</p>
      <p>This video needs to be processed through our CDN before playback.</p>
    </div>
  );
}
```

#### **Content Security Policy Compliance**

- **Blocks**: All TikTok, Instagram, YouTube direct URLs
- **Allows**: Only Bunny.net CDN domains
- **User Experience**: Clear messaging for blocked content
- **Security**: Prevents X-Frame-Options and CSP violations

## 🎉 **NEW: UI Component Patterns** (Dec 30, 2024)

### Smart Expandable Text Pattern

#### **Intelligent Truncation Component**

**Use Case**: Display long content in constrained spaces with user control.
**Pattern**: Smart detection with optional expansion.

```typescript
// ExpandableText component pattern
function ExpandableText({ content, maxLines = 4, className = "" }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Smart truncation detection
  const lines = content.split("\n");
  const needsTruncation = lines.length > maxLines || content.length > 300;

  if (!needsTruncation) {
    return <p className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>{content}</p>;
  }

  const truncatedContent = isExpanded
    ? content
    : lines.slice(0, maxLines).join("\n") + (lines.length > maxLines ? "..." : "");

  return (
    <div className="space-y-2">
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>{truncatedContent}</p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Show more
          </>
        )}
      </button>
    </div>
  );
}
```

#### **Smart Detection Logic**

- **Line-based**: Counts actual line breaks in content
- **Character-based**: Considers total content length (>300 chars)
- **User Control**: Toggle between expanded and collapsed states
- **Graceful Fallback**: No truncation UI for short content

### Core Microservices

#### 1. Video Downloader Service

**Location**: `/api/video/downloader`
**Responsibility**: Social media video downloading only

- Platform detection (TikTok/Instagram)
- Video download with metadata extraction
- Returns raw video buffer + metrics
- No knowledge of CDN, transcription, or business logic

#### 2. Video Uploader Service

**Location**: `/api/video/uploader`
**Responsibility**: CDN upload functionality only

- Accepts video files (multipart/form-data or JSON)
- Uploads to configured Bunny Stream CDN
- Returns CDN URLs or graceful failure
- Completely generic and platform-agnostic

#### 3. Download and Prepare Orchestrator

**Location**: `/api/video/download-and-prepare`
**Responsibility**: Complete workflow coordination

- Coordinates downloader → validator → uploader → analysis
- Makes internal API calls to focused services
- Handles graceful fallbacks when CDN upload fails
- Manages background analysis workflow
- Returns combined response

#### 4. Legacy Compatibility Layer

**Location**: `/api/download-video`
**Responsibility**: Backward compatibility

- Simple redirect to orchestrator service
- Maintains existing API contracts
- Zero breaking changes for existing clients

### Orchestration Patterns

#### Frontend Orchestrator Pattern

**Location**: `AddVideoDialog.handleSubmit()`

```typescript
// Step 1: Download video
const downloadResponse = await downloadVideo(url);

// Step 2: Transcribe video
const transcriptionResponse = await transcribeVideo(downloadResponse);

// Step 3: Generate thumbnail
const thumbnailUrl = await extractVideoThumbnail(downloadResponse);

// Step 4: Save to collection
const videoToAdd = createVideoObject(downloadResponse, transcriptionResponse, thumbnailUrl, url);
await CollectionsService.addVideoToCollection(user.uid, targetCollectionId, videoToAdd);
```

#### Backend Orchestrator Pattern

**Location**: `/api/video/download-and-prepare`

```typescript
// Step 1: Download from social media
const downloadResult = await callDownloaderService(baseUrl, url);

// Step 2: Validate constraints
const validationResult = validateVideoConstraints(downloadResult);

// Step 3: Upload to CDN (with graceful fallback)
const uploadResult = await callUploaderService(baseUrl, downloadResult);

// Step 4: Trigger background analysis
if (uploadResult.success) {
  triggerBackgroundAnalysis(uploadResult.videoId);
}

return {
  success: true,
  video: combinedVideoData,
  hostedOnCDN: uploadResult.success,
};
```

### Service Communication Pattern

#### Internal API Calls

```typescript
// Pattern for internal service communication
const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/video/downloader`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`, // Required for authentication
  },
  body: JSON.stringify({ url }),
});

if (!response.ok) {
  throw new Error(`Service call failed: ${response.status}`);
}

const result = await response.json();
```

#### Benefits of Service Communication Pattern

- **Environment Agnostic**: Works in both development and production
- **Authentication Consistent**: Proper token passing between services
- **Error Handling**: Consistent error propagation
- **Type Safety**: Structured request/response interfaces

### Background Processing Patterns

#### Fire-and-Forget Analysis

```typescript
// Trigger background analysis without blocking response
const triggerBackgroundAnalysis = async (videoId: string) => {
  // Don't await - let it run in background
  setTimeout(async () => {
    try {
      await fetch(`${baseUrl}/api/video/analyze-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
    } catch (error) {
      console.error("Background analysis failed:", error);
      // Log but don't throw - background process shouldn't affect user experience
    }
  }, 100); // Small delay to ensure main response completes first
};
```

#### Background Update Loop

```typescript
// Pattern for updating video records with analysis results
POST / api / video / update - transcription;
{
  videoId: string;
  transcriptionData: VideoAnalysis;
}

// Updates existing video record with completed analysis
const videoRef = db.collection("videos").doc(videoId);
await videoRef.update({
  transcript: transcriptionData.transcript,
  components: transcriptionData.components,
  insights: transcriptionData.insights,
  updatedAt: new Date().toISOString(),
});
```

### Error Handling Patterns

#### Graceful Fallback Pattern

```typescript
// CDN upload with local fallback
let hostedOnCDN = false;
let iframeUrl = "";

try {
  const uploadResult = await callUploaderService(baseUrl, downloadResult);
  if (uploadResult.success) {
    hostedOnCDN = true;
    iframeUrl = uploadResult.iframeUrl;
  }
} catch (error) {
  console.warn("CDN upload failed, using local fallback:", error);
  // Continue with local video data - don't fail the entire operation
}

return {
  success: true,
  video: {
    ...videoData,
    hostedOnCDN,
    iframeUrl: hostedOnCDN ? iframeUrl : "",
  },
};
```

#### User-Friendly Error Messages

```typescript
// Consistent error response format
const createErrorResponse = (message: string, details?: string) => {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details: details || "Please try again or contact support if the issue persists",
    },
    { status: 500 },
  );
};
```

### Data Consistency Patterns

#### RBAC-Compliant Video Storage

```typescript
// Ensure all required fields for RBAC queries
const videoData = {
  id: videoRef.id,
  userId: decodedToken.uid, // Required for user ownership
  addedAt: timestamp, // Required for RBAC ordering queries
  createdAt: timestamp,
  updatedAt: timestamp,
  collectionId,
  // ... other video properties
};

await videoRef.set(videoData);
```

#### Atomic Operations

```typescript
// Use Firestore batch operations for consistency
const batch = db.batch();

// Deactivate existing profiles
existingProfilesSnapshot.docs.forEach((doc) => {
  batch.update(doc.ref, { isActive: false, updatedAt: now });
});

// Create new active profile
const newProfileRef = db.collection("brandProfiles").doc();
batch.set(newProfileRef, brandProfile);

await batch.commit();
```

### Performance Optimization Patterns

#### React Query with Stale Time

```typescript
// Optimize network requests with appropriate stale time
const { data: profilesData } = useQuery({
  queryKey: ["brand-profiles"],
  queryFn: () => BrandProfileService.getBrandProfiles(),
  staleTime: 5 * 60 * 1000, // 5 minutes - profiles don't change frequently
});
```

#### Memoized Components

```typescript
// Prevent unnecessary re-renders for expensive components
const VideoEmbed = memo<VideoEmbedProps>(({ url, className = "" }) => {
  // Component implementation
});

const ExpandableText = memo<ExpandableTextProps>(({ content, maxLines = 4 }) => {
  // Component implementation
});
```

---

These patterns represent battle-tested solutions for both video processing and brand profile systems, ensuring reliable, performant, and maintainable code across the entire application.
