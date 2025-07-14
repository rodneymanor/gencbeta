import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { CollectionsService } from "@/lib/collections";
import { adminDb } from "@/lib/firebase-admin";

interface ProfileProcessingRequest {
  profileUrl: string;
  platform: "tiktok" | "instagram";
  voiceName?: string;
  videoCount?: number; // 10-200, default 50
}

interface ProfileProcessingResponse {
  success: boolean;
  jobId: string;
  collectionId: string;
  collectionName: string;
  estimatedProcessingTime: number;
  videoCount: number;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const userId = authResult.user.uid;
    console.log(`🎤 [VOICE_PROFILE] Processing profile for user: ${userId}`);

    const body: ProfileProcessingRequest = await request.json();
    const { profileUrl, platform, voiceName, videoCount = 50 } = body;

    // Validate input
    if (!profileUrl || !platform) {
      return NextResponse.json({ error: "Profile URL and platform are required" }, { status: 400 });
    }

    if (!["tiktok", "instagram"].includes(platform)) {
      return NextResponse.json({ error: "Platform must be 'tiktok' or 'instagram'" }, { status: 400 });
    }

    if (videoCount < 10 || videoCount > 200) {
      return NextResponse.json({ error: "Video count must be between 10 and 200" }, { status: 400 });
    }

    // Extract username from URL
    const username = extractUsernameFromUrl(profileUrl, platform);
    if (!username) {
      return NextResponse.json({ error: "Could not extract username from profile URL" }, { status: 400 });
    }

    console.log(`🎤 [VOICE_PROFILE] Processing ${platform} profile: @${username}`);

    // Create unique job ID
    const jobId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create collection for this profile's videos
    const collectionName = voiceName || `${username} Voice Collection`;
    const collectionDescription = `AI Voice training collection for @${username} on ${platform}. Contains ${videoCount} top-performing videos for voice template generation.`;

    const collection = await CollectionsService.createCollection(userId, {
      name: collectionName,
      description: collectionDescription,
      isPublic: false,
      tags: ["ai-voice", platform, username],
      metadata: {
        purpose: "voice-training",
        sourceProfile: profileUrl,
        platform: platform,
        username: username,
        targetVideoCount: videoCount,
        jobId: jobId,
      },
    });

    if (!collection.success || !collection.collectionId) {
      throw new Error("Failed to create collection for voice training");
    }

    const collectionId = collection.collectionId;
    console.log(`✅ [VOICE_PROFILE] Created collection: ${collectionId}`);

    // Create job tracking document
    const jobData = {
      jobId,
      userId,
      collectionId,
      profileUrl,
      platform,
      username,
      voiceName: voiceName || `${username} Voice`,
      videoCount,
      status: "discovering_videos",
      progress: 0,
      totalSteps: 4, // discover, download, transcribe, generate_templates
      currentStep: 1,
      stepName: "Discovering Videos",
      startedAt: new Date().toISOString(),
      estimatedCompletionAt: new Date(Date.now() + videoCount * 15000).toISOString(), // ~15s per video
      videosDiscovered: 0,
      videosProcessed: 0,
      templatesGenerated: 0,
      errors: [],
      metadata: {
        collectionName,
        collectionId,
      },
    };

    await adminDb.collection("voice_creation_jobs").doc(jobId).set(jobData);

    // Start background processing
    startBackgroundProcessing(jobId, jobData);

    const estimatedTime = Math.ceil(videoCount * 15); // 15 seconds per video estimate

    console.log(`🚀 [VOICE_PROFILE] Started background processing job: ${jobId}`);

    const response: ProfileProcessingResponse = {
      success: true,
      jobId,
      collectionId,
      collectionName,
      estimatedProcessingTime: estimatedTime,
      videoCount,
      message: `Started processing ${username}'s ${platform} profile. Collection created with ${videoCount} videos to process.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("🔥 [VOICE_PROFILE] Failed to process profile:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process profile",
      },
      { status: 500 },
    );
  }
}

function extractUsernameFromUrl(url: string, platform: string): string | null {
  try {
    // Remove @ symbol if present and clean URL
    const username = url.replace("@", "").trim();

    // If it's just a username, return it
    if (!username.includes("/") && !username.includes(".")) {
      return username;
    }

    // Extract from URL patterns
    if (platform === "tiktok") {
      const tiktokMatch = username.match(/(?:tiktok\.com\/@|@)([a-zA-Z0-9._-]+)/);
      return tiktokMatch ? tiktokMatch[1] : null;
    } else if (platform === "instagram") {
      const instagramMatch = username.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._-]+)/);
      return instagramMatch ? instagramMatch[1] : null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting username:", error);
    return null;
  }
}

async function startBackgroundProcessing(jobId: string, jobData: any) {
  // Use setTimeout to ensure response is sent first
  setTimeout(async () => {
    try {
      console.log(`🔄 [BACKGROUND] Starting profile processing for job: ${jobId}`);

      // Step 1: Discover and process videos
      await discoverAndProcessVideos(jobData);

      // Step 2: Wait for video processing to complete
      await waitForVideoProcessing(jobData);

      // Step 3: Generate templates from transcriptions
      await generateVoiceTemplates(jobData);

      // Step 4: Create final AI voice
      await createFinalVoice(jobData);

      console.log(`✅ [BACKGROUND] Completed profile processing for job: ${jobId}`);
    } catch (error) {
      console.error(`❌ [BACKGROUND] Failed to process profile for job ${jobId}:`, error);

      // Update job with error status
      await adminDb
        .collection("voice_creation_jobs")
        .doc(jobId)
        .update({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date().toISOString(),
          progress: 100,
        });
    }
  }, 100);
}

async function discoverAndProcessVideos(jobData: any) {
  console.log(`🔍 [BACKGROUND] Step 1: Discovering videos for ${jobData.username}`);

  // Update job status
  await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
    status: "discovering_videos",
    currentStep: 1,
    stepName: "Discovering Videos",
    progress: 10,
  });

  // Call the existing process-creator API to discover videos
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3001}`;

  const discoverResponse = await fetch(`${baseUrl}/api/process-creator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: jobData.username,
      platform: jobData.platform,
      videoCount: jobData.videoCount,
    }),
  });

  if (!discoverResponse.ok) {
    throw new Error("Failed to discover videos from profile");
  }

  const discoverData = await discoverResponse.json();

  if (!discoverData.success || !discoverData.extractedVideos) {
    throw new Error("No videos found in profile");
  }

  console.log(`✅ [BACKGROUND] Discovered ${discoverData.extractedVideos.length} videos`);

  // Update job with discovered videos
  await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
    videosDiscovered: discoverData.extractedVideos.length,
    discoveredVideos: discoverData.extractedVideos,
    status: "processing_videos",
    currentStep: 2,
    stepName: "Processing Videos",
    progress: 25,
  });

  // Process videos through the collection pipeline
  const videoPromises = discoverData.extractedVideos.map((video: any, index: number) =>
    processVideoToCollection(jobData.collectionId, video, index, jobData.jobId),
  );

  // Process in batches of 10 to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < videoPromises.length; i += batchSize) {
    const batch = videoPromises.slice(i, i + batchSize);
    await Promise.allSettled(batch);

    // Update progress
    const processed = Math.min(i + batchSize, videoPromises.length);
    const progress = 25 + Math.round((processed / videoPromises.length) * 40); // 25-65%

    await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
      videosProcessed: processed,
      progress: progress,
    });

    console.log(`📊 [BACKGROUND] Processed ${processed}/${videoPromises.length} videos`);

    // Small delay between batches
    if (i + batchSize < videoPromises.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function processVideoToCollection(collectionId: string, video: any, index: number, jobId: string) {
  try {
    console.log(`🎬 [BACKGROUND] Processing video ${index + 1}: ${video.id}`);

    // Use the existing video processing pipeline
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3001}`;

    const response = await fetch(`${baseUrl}/api/add-video-to-collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: video.video_url,
        collectionId: collectionId,
        title: `${video.platform} Video ${index + 1}`,
        metadata: {
          originalId: video.id,
          platform: video.platform,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          quality: video.quality,
          voiceTrainingSource: true,
          jobId: jobId,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [BACKGROUND] Successfully processed video ${index + 1}`);
      return result;
    } else {
      console.warn(`⚠️ [BACKGROUND] Failed to process video ${index + 1}: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [BACKGROUND] Error processing video ${index + 1}:`, error);
    return null;
  }
}

async function waitForVideoProcessing(jobData: any) {
  console.log(`⏳ [BACKGROUND] Step 2: Waiting for video transcriptions to complete`);

  await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
    status: "waiting_transcriptions",
    currentStep: 3,
    stepName: "Transcribing Videos",
    progress: 65,
  });

  // Wait for transcriptions to complete (check every 30 seconds, max 30 minutes)
  const maxWaitTime = 30 * 60 * 1000; // 30 minutes
  const checkInterval = 30 * 1000; // 30 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const videosSnapshot = await adminDb.collection("videos").where("collectionId", "==", jobData.collectionId).get();

    const videos = videosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const completedTranscriptions = videos.filter(
      (video) => video.transcriptionStatus === "completed" && video.transcript,
    );

    const progress = 65 + Math.round((completedTranscriptions.length / videos.length) * 20); // 65-85%

    await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
      transcriptionsCompleted: completedTranscriptions.length,
      totalVideos: videos.length,
      progress: progress,
    });

    console.log(`📊 [BACKGROUND] Transcriptions: ${completedTranscriptions.length}/${videos.length} completed`);

    // If we have enough transcriptions (at least 70% or minimum 10), proceed
    if (completedTranscriptions.length >= Math.max(Math.ceil(videos.length * 0.7), 10)) {
      console.log(`✅ [BACKGROUND] Sufficient transcriptions completed, proceeding to template generation`);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }
}

async function generateVoiceTemplates(jobData: any) {
  console.log(`🧠 [BACKGROUND] Step 3: Generating voice templates`);

  await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
    status: "generating_templates",
    currentStep: 4,
    stepName: "Generating Templates",
    progress: 85,
  });

  // Get completed transcriptions
  const videosSnapshot = await adminDb
    .collection("videos")
    .where("collectionId", "==", jobData.collectionId)
    .where("transcriptionStatus", "==", "completed")
    .get();

  const transcribedVideos = videosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (transcribedVideos.length === 0) {
    throw new Error("No transcribed videos available for template generation");
  }

  console.log(`📝 [BACKGROUND] Generating templates from ${transcribedVideos.length} transcribed videos`);

  // Use the existing template generation service
  const { TemplateGenerator } = await import("@/lib/template-generator-service/dist/template-generator");
  const templateGenerator = new TemplateGenerator();

  const templates = [];
  let successCount = 0;

  for (const video of transcribedVideos) {
    try {
      if (video.transcript && video.transcript.length > 50) {
        const result = await templateGenerator.generateTemplatesFromTranscription(video.transcript);

        if (result.success && result.templates) {
          templates.push({
            id: `template_${video.id}_${Date.now()}`,
            hook: result.templates.hook,
            bridge: result.templates.bridge,
            nugget: result.templates.nugget,
            wta: result.templates.wta,
            originalContent: result.originalContent,
            sourceVideoId: video.id,
            sourceMetadata: {
              viewCount: video.metrics?.viewCount,
              likeCount: video.metrics?.likeCount,
              platform: jobData.platform,
              url: video.originalUrl,
            },
          });
          successCount++;
        }
      }
    } catch (error) {
      console.warn(`⚠️ [BACKGROUND] Failed to generate template for video ${video.id}:`, error);
    }

    // Small delay between template generations
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (templates.length === 0) {
    throw new Error("Failed to generate any templates from transcribed videos");
  }

  console.log(`✅ [BACKGROUND] Generated ${templates.length} templates from ${transcribedVideos.length} videos`);

  // Update job with templates
  await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
    templatesGenerated: templates.length,
    templates: templates,
    progress: 95,
  });

  return templates;
}

async function createFinalVoice(jobData: any) {
  console.log(`🎤 [BACKGROUND] Step 4: Creating final AI voice`);

  await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
    status: "creating_voice",
    stepName: "Creating Voice",
    progress: 95,
  });

  // Get the generated templates
  const jobDoc = await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).get();
  const currentJobData = jobDoc.data();

  if (!currentJobData?.templates || currentJobData.templates.length === 0) {
    throw new Error("No templates available for voice creation");
  }

  // Create the AI voice using existing service
  const { AIVoicesService } = await import("@/lib/ai-voices-service");

  const voiceData = {
    name: jobData.voiceName,
    badges: generateVoiceBadges(currentJobData.templates),
    description: `AI voice inspired by @${jobData.username}'s content style on ${jobData.platform}. Generated from ${currentJobData.templates.length} analyzed videos.`,
    creatorInspiration: jobData.username,
    templates: currentJobData.templates,
    exampleScripts: [], // Will be populated from collection videos
    isShared: false,
    userId: jobData.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: false,
    metadata: {
      sourceCollection: jobData.collectionId,
      sourceProfile: jobData.profileUrl,
      platform: jobData.platform,
      jobId: jobData.jobId,
      videosAnalyzed: currentJobData.videosProcessed,
      templatesGenerated: currentJobData.templatesGenerated,
    },
  };

  const docRef = await adminDb.collection("ai_voices").add(voiceData);

  console.log(`✅ [BACKGROUND] Created AI voice: ${docRef.id}`);

  // Update job with completion
  await adminDb.collection("voice_creation_jobs").doc(jobData.jobId).update({
    status: "completed",
    voiceId: docRef.id,
    completedAt: new Date().toISOString(),
    progress: 100,
    stepName: "Completed",
  });

  return docRef.id;
}

function generateVoiceBadges(templates: any[]): string[] {
  const badges = [];

  if (templates.length > 50) {
    badges.push("Extensive");
  } else if (templates.length > 20) {
    badges.push("Comprehensive");
  } else {
    badges.push("Focused");
  }

  // Analyze template content for additional badges
  const templateTexts = templates
    .map((t) => `${t.hook} ${t.nugget} ${t.wta}`)
    .join(" ")
    .toLowerCase();

  if (templateTexts.includes("learn") || templateTexts.includes("tip") || templateTexts.includes("secret")) {
    badges.push("Educational");
  }

  if (templateTexts.includes("start") || templateTexts.includes("action") || templateTexts.includes("success")) {
    badges.push("Motivational");
  }

  // Ensure we have exactly 3 badges
  while (badges.length < 3) {
    badges.push("Professional");
  }

  return badges.slice(0, 3);
}
