# System Patterns

## 🎉 **NEW: Brand Profile System Architecture** (January 2, 2025)

### AI-Powered Brand Profile Generation

#### **Gemini 2.0 Flash Integration Pattern**
**Problem**: Generate comprehensive brand strategies from user questionnaires.
**Solution**: Robust AI integration with JSON parsing and error handling.

```typescript
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
    return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  };

  const cleanedResponse = cleanMarkdownCodeBlocks(result.response.text());
  const profileData = JSON.parse(cleanedResponse);
  
  return profileData;
};
```

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
  .where("userId", "==", userId)      // Filter by user
  .orderBy("createdAt", "desc")       // Order by creation time
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
  hostedOnCDN: uploadResult.success
};
```

### Service Communication Pattern

#### Internal API Calls
```typescript
// Pattern for internal service communication
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/video/downloader`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${idToken}` // Required for authentication
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
POST /api/video/update-transcription
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
  updatedAt: new Date().toISOString()
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
  }
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
      details: details || "Please try again or contact support if the issue persists"
    },
    { status: 500 }
  );
};
```

### Data Consistency Patterns

#### RBAC-Compliant Video Storage
```typescript
// Ensure all required fields for RBAC queries
const videoData = {
  id: videoRef.id,
  userId: decodedToken.uid,     // Required for user ownership
  addedAt: timestamp,           // Required for RBAC ordering queries
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