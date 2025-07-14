/**
 * Video Metadata Service
 * Centralized metadata extraction for engagement, author, and hashtag analysis
 */

import type { VideoMetrics, VideoMetadata } from "./downloader";
import type { Platform } from "./platform-detector";

export interface ContentMetadata {
  platform: Platform;
  author: string;
  description: string;
  source: string;
  hashtags: string[];
  duration?: number;
  uploadDate?: string;
  category?: string;
}

export interface EngagementMetrics extends VideoMetrics {
  engagementRate?: number;
  reach?: number;
  impressions?: number;
}

export interface VideoAnalysis {
  contentMetadata: ContentMetadata;
  engagementMetrics: EngagementMetrics;
  contentScore?: number;
  viralPotential?: number;
}

/**
 * Extracts comprehensive metadata from video content
 * @param platform - Platform the video is from
 * @param rawMetadata - Raw metadata from platform
 * @param transcript - Video transcript (optional)
 * @returns Structured content metadata
 */
export function extractContentMetadata(platform: Platform, rawMetadata: any, transcript?: string): ContentMetadata {
  const baseMetadata: ContentMetadata = {
    platform,
    author: extractAuthor(rawMetadata, platform),
    description: extractDescription(rawMetadata, platform),
    source: platform,
    hashtags: extractHashtags(rawMetadata, transcript),
    duration: extractDuration(rawMetadata, platform),
    uploadDate: extractUploadDate(rawMetadata, platform),
    category: extractCategory(rawMetadata, platform),
  };

  return baseMetadata;
}

/**
 * Extracts author information from platform metadata
 * @param rawMetadata - Raw metadata from platform
 * @param platform - Platform the video is from
 * @returns Author name or username
 */
function extractAuthor(rawMetadata: any, platform: Platform): string {
  switch (platform) {
    case "tiktok":
      return rawMetadata?.author?.nickname || rawMetadata?.author?.uniqueId || "Unknown";
    case "instagram":
      return rawMetadata?.user?.username || rawMetadata?.user?.full_name || "Unknown";
    case "youtube":
      return rawMetadata?.snippet?.channelTitle || rawMetadata?.author?.name || "Unknown";
    default:
      return "Unknown";
  }
}

/**
 * Extracts description from platform metadata
 * @param rawMetadata - Raw metadata from platform
 * @param platform - Platform the video is from
 * @returns Video description
 */
function extractDescription(rawMetadata: any, platform: Platform): string {
  switch (platform) {
    case "tiktok":
      return rawMetadata?.desc || rawMetadata?.description || "";
    case "instagram":
      return rawMetadata?.caption?.text || rawMetadata?.description || "";
    case "youtube":
      return rawMetadata?.snippet?.description || rawMetadata?.description || "";
    default:
      return "";
  }
}

/**
 * Extracts hashtags from metadata and transcript
 * @param rawMetadata - Raw metadata from platform
 * @param transcript - Video transcript (optional)
 * @returns Array of hashtags
 */
function extractHashtags(rawMetadata: any, transcript?: string): string[] {
  const hashtags: string[] = [];

  // Extract from metadata
  if (rawMetadata?.hashtags) {
    hashtags.push(...rawMetadata.hashtags);
  }

  // Extract from description/caption
  const description = rawMetadata?.desc || rawMetadata?.caption?.text || rawMetadata?.description || "";
  const descriptionHashtags = description.match(/#[\w\u0590-\u05ff]+/g) || [];
  hashtags.push(...descriptionHashtags);

  // Extract from transcript
  if (transcript) {
    const transcriptHashtags = transcript.match(/#[\w\u0590-\u05ff]+/g) || [];
    hashtags.push(...transcriptHashtags);
  }

  // Remove duplicates and normalize
  return [...new Set(hashtags.map((tag) => tag.toLowerCase()))];
}

/**
 * Extracts duration from platform metadata
 * @param rawMetadata - Raw metadata from platform
 * @param platform - Platform the video is from
 * @returns Duration in seconds
 */
function extractDuration(rawMetadata: any, platform: Platform): number | undefined {
  switch (platform) {
    case "tiktok":
      return rawMetadata?.video?.duration || rawMetadata?.duration;
    case "instagram":
      return rawMetadata?.video_duration || rawMetadata?.duration;
    case "youtube":
      return rawMetadata?.contentDetails?.duration ? parseDuration(rawMetadata.contentDetails.duration) : undefined;
    default:
      return undefined;
  }
}

/**
 * Extracts upload date from platform metadata
 * @param rawMetadata - Raw metadata from platform
 * @param platform - Platform the video is from
 * @returns Upload date string
 */
function extractUploadDate(rawMetadata: any, platform: Platform): string | undefined {
  switch (platform) {
    case "tiktok":
      return rawMetadata?.createTime ? new Date(rawMetadata.createTime * 1000).toISOString() : undefined;
    case "instagram":
      return rawMetadata?.taken_at_timestamp
        ? new Date(rawMetadata.taken_at_timestamp * 1000).toISOString()
        : undefined;
    case "youtube":
      return rawMetadata?.snippet?.publishedAt;
    default:
      return undefined;
  }
}

/**
 * Extracts category from platform metadata
 * @param rawMetadata - Raw metadata from platform
 * @param platform - Platform the video is from
 * @returns Category string
 */
function extractCategory(rawMetadata: any, platform: Platform): string | undefined {
  switch (platform) {
    case "tiktok":
      return rawMetadata?.category || rawMetadata?.music?.title;
    case "instagram":
      return rawMetadata?.category || rawMetadata?.media_type;
    case "youtube":
      return rawMetadata?.snippet?.categoryId;
    default:
      return undefined;
  }
}

/**
 * Parses YouTube duration format (PT1M30S) to seconds
 * @param duration - YouTube duration string
 * @returns Duration in seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Calculates engagement rate from metrics
 * @param metrics - Video engagement metrics
 * @returns Engagement rate as percentage
 */
export function calculateEngagementRate(metrics: VideoMetrics): number {
  const { likes, views, shares, comments } = metrics;

  if (views === 0) return 0;

  const totalEngagement = likes + shares + comments;
  return (totalEngagement / views) * 100;
}

/**
 * Analyzes video content for viral potential
 * @param metrics - Video engagement metrics
 * @param metadata - Content metadata
 * @returns Viral potential score (0-100)
 */
export function analyzeViralPotential(metrics: VideoMetrics, metadata: ContentMetadata): number {
  const engagementRate = calculateEngagementRate(metrics);
  const hashtagCount = metadata.hashtags.length;
  const hasDescription = metadata.description.length > 0;

  let score = 0;

  // Engagement rate weight (40%)
  score += Math.min(engagementRate * 2, 40);

  // Hashtag optimization weight (30%)
  score += Math.min(hashtagCount * 3, 30);

  // Content completeness weight (20%)
  score += hasDescription ? 20 : 0;

  // Platform-specific factors (10%)
  switch (metadata.platform) {
    case "tiktok":
      score += metrics.shares > 100 ? 10 : 0;
      break;
    case "instagram":
      score += metrics.saves > 50 ? 10 : 0;
      break;
    case "youtube":
      score += metrics.comments > 20 ? 10 : 0;
      break;
  }

  return Math.min(score, 100);
}

/**
 * Generates content score based on various factors
 * @param metadata - Content metadata
 * @param metrics - Engagement metrics
 * @returns Content quality score (0-100)
 */
export function generateContentScore(metadata: ContentMetadata, metrics: VideoMetrics): number {
  let score = 0;

  // Description quality (25%)
  const descriptionLength = metadata.description.length;
  score += Math.min(descriptionLength / 10, 25);

  // Hashtag optimization (20%)
  const hashtagScore = Math.min(metadata.hashtags.length * 2, 20);
  score += hashtagScore;

  // Engagement quality (30%)
  const engagementRate = calculateEngagementRate(metrics);
  score += Math.min(engagementRate * 3, 30);

  // Content completeness (25%)
  if (metadata.duration) score += 10;
  if (metadata.uploadDate) score += 5;
  if (metadata.category) score += 5;
  if (metadata.author !== "Unknown") score += 5;

  return Math.min(score, 100);
}
