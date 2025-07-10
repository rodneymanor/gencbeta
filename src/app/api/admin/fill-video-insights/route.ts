import { NextResponse } from "next/server";

/* eslint-disable complexity, max-depth */

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import {
  fetchInstagramMetadata,
  extractMetricsFromMetadata as extractInstagramMetrics,
  extractAdditionalMetadata as extractInstagramAdditional,
} from "@/lib/instagram-downloader";
import { getTikTokMetrics, getTikTokAdditionalMetadata } from "@/lib/tiktok-downloader";
import { extractInstagramShortcode } from "@/lib/video-processing-helpers";

interface VideoDoc {
  id: string;
  platform?: string;
  originalUrl?: string;
  transcript?: string;
  components?: Record<string, unknown>;
  contentMetadata?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function analyzeVideo(url: string) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/video/analyze-complete`, {
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
}

async function fetchMetricsAndExtras(video: VideoDoc) {
  if (!video.originalUrl) return { metrics: undefined, extras: undefined };

  const platform = (video.platform ?? "").toLowerCase();
  try {
    if (platform === "tiktok") {
      const [metrics, extras] = await Promise.all([
        getTikTokMetrics(video.originalUrl),
        getTikTokAdditionalMetadata(video.originalUrl),
      ]);
      return { metrics, extras };
    }

    if (platform === "instagram") {
      const shortcode = extractInstagramShortcode(video.originalUrl);
      if (!shortcode) return { metrics: undefined, extras: undefined };
      const metadata = await fetchInstagramMetadata(shortcode);
      if (!metadata) return { metrics: undefined, extras: undefined };
      const metrics = extractInstagramMetrics(metadata);
      const extras = extractInstagramAdditional(metadata);
      return { metrics, extras };
    }
  } catch (error) {
    console.error("❌ [INSIGHTS] Metrics fetch failed for", video.id, error);
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

    const BATCH_SIZE = 300;
    let batch = adminDb.batch();
    let updatesInBatch = 0;
    let totalUpdates = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data() as VideoDoc;
      const vid: VideoDoc = { id: doc.id, ...data };

      const needsTranscript = !vid.transcript || vid.transcript.trim().length < 20;

      if (!needsTranscript) {
        continue; // Skip videos that already have transcripts
      }

      log(`\n🎯 Processing video ${vid.id}`);

      const updateFields: Record<string, unknown> = {};

      // Fetch analysis (transcript, components, metadata)
      if (vid.originalUrl) {
        const analysis = await analyzeVideo(vid.originalUrl);
        if (analysis) {
          if (!vid.transcript && analysis.transcript) {
            updateFields.transcript = analysis.transcript;
          }
          if (!vid.components && analysis.components) {
            updateFields.components = analysis.components;
          }
          if (!vid.contentMetadata && analysis.contentMetadata) {
            updateFields.contentMetadata = analysis.contentMetadata;
          }
        }
      }

      // Fetch metrics & extra metadata if missing
      const { metrics, extras } = await fetchMetricsAndExtras(vid);
      if (!vid.metrics && metrics) {
        updateFields.metrics = metrics;
      }

      if (extras) {
        if (!vid.contentMetadata?.description && extras.description) {
          updateFields["contentMetadata.description"] = extras.description;
        }
        if (!vid.contentMetadata?.author && extras.author) {
          updateFields["contentMetadata.author"] = extras.author;
        }
        if (!vid.contentMetadata?.hashtags && extras.hashtags) {
          updateFields["contentMetadata.hashtags"] = extras.hashtags;
        }
        if (!vid.duration && extras.duration) {
          updateFields.duration = extras.duration;
        }
      }

      if (Object.keys(updateFields).length === 0) {
        log(`  ✔️ Skipping ${vid.id} - no updates needed`);
        continue;
      }

      updateFields.updatedAt = new Date();

      batch.update(doc.ref, updateFields);
      updatesInBatch++;
      totalUpdates++;

      if (updatesInBatch >= BATCH_SIZE) {
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
