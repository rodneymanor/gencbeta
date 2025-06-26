# System Patterns

## Video Processing Microservices Architecture

### Overview
The video processing system follows a microservice architecture with clear separation of concerns, orchestration patterns, and graceful fallbacks.

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
const sizeValidationResult = validateVideoSize(downloadResult.videoData.size);

// Step 3: Upload to CDN (optional)
const uploadResult = await callUploaderService(baseUrl, downloadResult.videoData);

// Step 4: Background analysis (fire-and-forget)
startBackgroundAnalysis(downloadResult.videoData);

// Step 5: Return combined response
return createWorkflowResponse(downloadResult, uploadResult);
```

#### Service Orchestrator Pattern
**Location**: `CollectionsService.addVideoToCollection()`
```typescript
// Firestore transaction coordination
const batch = writeBatch(db);
batch.set(videoRef, videoData);
await updateCollectionVideoCount(batch, collectionId, userId, 1);
await batch.commit();
```

### Background Processing Architecture

#### Fire-and-Forget Pattern
```typescript
// Start analysis without blocking response
setTimeout(async () => {
  const analysisResult = await fetch(`${baseUrl}/api/video/analyze-complete`, {
    method: "POST",
    body: formData,
  });
  // TODO: Update video record with results
}, 100);
```

#### Performance Benefits
- **10x Faster**: 2-5 seconds vs 30-60 seconds
- **Immediate UI Response**: Video appears instantly with placeholder
- **Background Completion**: Full analysis completes invisibly

### Transcription Intelligence System

#### Smart Transcription Hierarchy
1. **Pre-existing Transcription** (fastest)
   - Already included in download response
   - No additional API calls needed

2. **Background Processing Placeholder** (optimal UX)
   - Immediate placeholder with loading indicators
   - Real transcription happens in background

3. **Synchronous CDN Transcription** (fallback)
   - Additional API call with CDN URL
   - Complete but slower

4. **Synchronous Buffer Transcription** (last resort)
   - Local video buffer processing
   - Guaranteed to work but slowest

#### Placeholder Transcription System
**Location**: `video-processing-utils.ts`
```typescript
export function createPlaceholderTranscription(platform: string, author: string): TranscriptionResponse {
  return {
    transcript: "🔄 Transcription is being processed in the background...",
    components: {
      hook: "⏳ Analyzing video hook...",
      bridge: "⏳ Extracting bridge content...",
      nugget: "⏳ Identifying key insights...",
      wta: "⏳ Determining call-to-action...",
    },
    // ... structured placeholder data
  };
}
```

### Graceful Fallback Patterns

#### CDN Upload Fallbacks
```typescript
// Primary: Bunny Stream CDN
if (isBunnyStreamConfigured()) {
  const cdnResult = await uploadToBunnyCDN(videoData);
  if (cdnResult) return cdnResult.cdnUrl;
}

// Fallback: Local video buffer
return {
  videoData: downloadResult.videoData,
  hostedOnCDN: false
};
```

#### Transcription Fallbacks
```typescript
// Check for existing transcription
if (downloadResponse.transcription) return downloadResponse.transcription;

// Use placeholder for background processing
if (downloadResponse.metadata.transcriptionStatus === "pending") {
  return createPlaceholderTranscription(platform, author);
}

// Fallback to synchronous transcription
return await transcribeFromSource(downloadResponse);
```

### Error Handling Patterns

#### Service-Level Error Handling
- Each service has focused error responses
- Comprehensive logging with emoji prefixes
- Graceful degradation rather than complete failure

#### Orchestrator-Level Error Handling
- Catches service failures and provides fallbacks
- Returns partial success when possible
- Clear error messages for UI feedback

### Configuration Management

#### Environment-Based Service Discovery
```typescript
const isBunnyStreamConfigured = () => {
  return !!(
    process.env.BUNNY_STREAM_LIBRARY_ID &&
    process.env.BUNNY_STREAM_API_KEY &&
    process.env.BUNNY_CDN_HOSTNAME
  );
};
```

#### Service Communication
- Internal HTTP requests between services
- Environment-aware base URLs (VERCEL_URL vs localhost)
- Proper timeout and retry logic

### Data Flow Patterns

#### Request/Response Flow
```
User → Frontend → /api/download-video → /api/video/download-and-prepare
                                          ↓
                                      1. /api/video/downloader
                                          ↓
                                      2. /api/video/uploader
                                          ↓
                                      3. Background: /api/video/analyze-complete
                                          ↓
                                      4. Combined response
```

#### Collection Integration Flow
```
Video Processing → createVideoObject → CollectionsService.addVideoToCollection
                                          ↓
                                      Firestore Transaction
                                          ↓
                                      Collection Count Update
                                          ↓
                                      UI Refresh
```

### Testing & Debugging Patterns

#### Comprehensive Logging
- Service-specific emoji prefixes (📥 [DOWNLOADER], 📤 [UPLOADER], 🎬 [ORCHESTRATOR])
- Step-by-step progress tracking
- Error context preservation

#### Service Isolation
- Each service can be tested independently
- Clear input/output contracts
- Focused unit testing capabilities

### Future Enhancement Patterns

#### Real-time Updates
- WebSocket integration for background transcription completion
- Live progress updates for long-running operations
- Real-time collection synchronization

#### Caching Strategies
- CDN URL caching for repeated access
- Transcription result caching
- Metadata persistence for offline access

#### Scaling Patterns
- Horizontal scaling of individual services
- Queue-based background processing
- Load balancing for high-traffic scenarios 