import { NextResponse } from "next/server";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import {
  fetchInstagramMetadata,
  extractMetricsFromMetadata as extractInstagramMetrics,
  extractAdditionalMetadata as extractInstagramAdditional,
} from "@/lib/instagram-downloader";
import { getTikTokMetrics, getTikTokAdditionalMetadata } from "@/lib/tiktok-downloader";
import { buildInternalUrl } from "@/lib/utils/url";
import { extractInstagramShortcode } from "@/lib/video-processing-helpers";

interface VideoDoc {
  id: string;
  platform?: string;
  originalUrl?: string;
  transcript?: string;
  components?: Record<string, unknown>;
  contentMetadata?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  duration?: number;
}

// Rate limiting and delay utilities
async function delayBetweenRequests(ms = 6000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry logic with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⚠️ [INSIGHTS] Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

async function analyzeVideo(url: string) {
  try {
    // Add delay before API call to respect rate limits
    await delayBetweenRequests(6000);

    const response = await fetch(buildInternalUrl("/api/video/analyze-complete"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: url }),
    });

    if (!response.ok) {
      console.error("❌ [INSIGHTS] analyze-complete failed:", response.status);
      return null;
    }

    return (await response.json()) as {
      transcript: string;
      components: Record<string, unknown>;
      contentMetadata: Record<string, unknown>;
    };
  } catch (error) {
    console.error("❌ [INSIGHTS] analyzeVideo error:", error);
    return null;
  }
}

async function fetchMetricsAndExtras(video: VideoDoc) {
  if (!video.originalUrl) return { metrics: undefined, extras: undefined };

  const platform = (video.platform ?? "").toLowerCase();

  try {
    if (platform === "tiktok") {
      // Add delay before TikTok API calls
      await delayBetweenRequests(2000);

      const [metrics, extras] = await Promise.all([
        retryWithBackoff(() => getTikTokMetrics(video.originalUrl!)),
        retryWithBackoff(() => getTikTokAdditionalMetadata(video.originalUrl!)),
      ]);
      return { metrics, extras };
    }

    if (platform === "instagram") {
      // Add delay before Instagram API calls
      await delayBetweenRequests(3000);

      const shortcode = extractInstagramShortcode(video.originalUrl);
      if (!shortcode) return { metrics: undefined, extras: undefined };

      const metadata = await retryWithBackoff(() => fetchInstagramMetadata(shortcode));
      if (!metadata) return { metrics: undefined, extras: undefined };

      const metrics = extractInstagramMetrics(metadata);
      const extras = extractInstagramAdditional(metadata);
      return { metrics, extras };
    }
  } catch (error) {
    console.error("❌ [INSIGHTS] Metrics fetch failed for", video.id, error);
    // Continue processing other videos even if this one fails
  }

  return { metrics: undefined, extras: undefined };
}

export async function POST() {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  if (!isAdminInitialized) {
    log("❌ Firebase Admin not initialized");
    return NextResponse.json({ logs, error: true }, { status: 500 });
  }

  const adminDb = getAdminDb();
  const videosRef = adminDb.collection("videos");

  try {
    const snapshot = await videosRef.get();
    if (snapshot.empty) {
      log("✅ No videos found");
      return NextResponse.json({ logs });
    }

    log(`🔍 Checking ${snapshot.size} videos for missing insights`);

    // Process videos in smaller batches to avoid overwhelming APIs
    const PROCESSING_BATCH_SIZE = 3; // Process only 3 videos at a time
    const DB_BATCH_SIZE = 50; // Database batch size for commits
    let batch = adminDb.batch();
    let updatesInBatch = 0;
    let totalUpdates = 0;
    let processedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const vid: VideoDoc = { id: doc.id, ...data };

      // More robust checking for empty/missing values
      const needsTranscript = !vid.transcript || vid.transcript.trim().length < 20;

      // Better author checking
      const currentAuthorRaw = (vid.contentMetadata?.author as string | undefined) ?? "";
      const currentAuthor = currentAuthorRaw.trim().toLowerCase();
      const needsAuthorUpdate = !currentAuthor || ["unknown", "author", "", "n/a"].includes(currentAuthor);

      // Better saves checking
      const currentSaves = vid.metrics?.saves as number | undefined;
      const needsSavesUpdate = currentSaves === undefined || currentSaves === 0;

      if (!needsTranscript && !needsAuthorUpdate && !needsSavesUpdate) {
        continue; // Skip videos that already have required insights
      }

      log(`\n🎯 Processing video ${vid.id} (${processedCount + 1}/${snapshot.size})`);

      const updateFields: Record<string, unknown> = {};
      let contentMeta: Record<string, unknown> | undefined = vid.contentMetadata
        ? { ...vid.contentMetadata }
        : undefined;

      try {
        // Fetch analysis (transcript, components, metadata)
        if (vid.originalUrl) {
          const analysis = await analyzeVideo(vid.originalUrl);
          if (analysis) {
            if (!vid.transcript && analysis.transcript) {
              updateFields.transcript = analysis.transcript;
              log(`  ✅ Added transcript (${analysis.transcript.length} chars)`);
            }
            if (!vid.components && analysis.components) {
              updateFields.components = analysis.components;
              log(`  ✅ Added script components`);
            }
            if (!vid.contentMetadata && analysis.contentMetadata) {
              contentMeta = { ...analysis.contentMetadata };
              log(`  ✅ Added content metadata`);
            }
          }
        }

        // Fetch metrics & extra metadata if missing or incomplete
        const { metrics, extras } = await fetchMetricsAndExtras(vid);

        // Merge metrics (focus on saves)
        if (metrics) {
          const currentMetrics = vid.metrics ? { ...vid.metrics } : {};
          const shouldUpdateSaves =
            (currentMetrics.saves === undefined || currentMetrics.saves === 0) &&
            metrics.saves !== undefined &&
            metrics.saves > 0;

          // If the video had no metrics at all, just replace
          if (!vid.metrics) {
            updateFields.metrics = metrics;
            log(`  ✅ Added metrics`);
          } else if (shouldUpdateSaves) {
            updateFields.metrics = { ...currentMetrics, saves: metrics.saves };
            log(`  ✅ Updated saves count: ${metrics.saves}`);
          }
        }

        if (extras) {
          // Ensure contentMeta object exists if we need to add fields
          if (!contentMeta) contentMeta = { ...vid.contentMetadata };

          if (extras.description && !contentMeta.description) {
            contentMeta.description = extras.description;
            log(`  ✅ Added description`);
          }
          const currentAuthor = (contentMeta.author as string | undefined)?.toLowerCase() ?? "";
          const needsAuthorUpdate = !currentAuthor || ["unknown", "author", "", "n/a"].includes(currentAuthor);

          if (extras.author && needsAuthorUpdate) {
            contentMeta.author = extras.author;
            log(`  ✅ Updated author: ${extras.author}`);
          }
          if (extras.hashtags && !contentMeta.hashtags) {
            contentMeta.hashtags = extras.hashtags;
            log(`  ✅ Added hashtags (${extras.hashtags.length})`);
          }
          if (extras.duration && !vid.duration) {
            updateFields.duration = extras.duration;
            log(`  ✅ Added duration: ${extras.duration}s`);
          }
        }
      } catch (error) {
        log(`  ⚠️ Error processing video ${vid.id}: ${error instanceof Error ? error.message : String(error)}`);
        continue; // Skip this video and continue with the next one
      }

      if (contentMeta && JSON.stringify(contentMeta) !== JSON.stringify(vid.contentMetadata)) {
        updateFields.contentMetadata = contentMeta;
      }

      if (Object.keys(updateFields).length === 0) {
        log(`  ✔️ Skipping ${vid.id} - no updates needed`);
        continue;
      }

      updateFields.updatedAt = new Date();

      batch.update(doc.ref, updateFields);
      updatesInBatch++;
      totalUpdates++;
      processedCount++;

      // Add delay between processing batches to avoid overwhelming APIs
      if (processedCount % PROCESSING_BATCH_SIZE === 0) {
        log(`⏳ Processed ${processedCount} videos, taking a 10-second break...`);
        await delayBetweenRequests(10000);
      }

      if (updatesInBatch >= DB_BATCH_SIZE) {
        log(`📦 Committing batch of ${updatesInBatch} updates...`);
        await batch.commit();
        batch = adminDb.batch();
        updatesInBatch = 0;
      }
    }

    if (updatesInBatch > 0) {
      log(`📦 Committing final batch of ${updatesInBatch} updates...`);
      await batch.commit();
    }

    log("\n-----------------------------------------");
    log(`🎉 Insights update complete! Total videos updated: ${totalUpdates}`);
    log("-----------------------------------------");

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("❌ [INSIGHTS] Update process failed:", error);
    log(`❌ Update failed: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ logs, error: true }, { status: 500 });
  }
}
