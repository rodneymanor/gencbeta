/* eslint-disable complexity, max-depth, max-lines, security/detect-object-injection, @typescript-eslint/no-explicit-any */
import { fetchVideo } from "@prevter/tiktok-scraper";

export async function downloadTikTokViaRapidAPI(
  videoId: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log("🌐 [DOWNLOAD] Calling TikTok RapidAPI with 30s timeout...");

    const metadataResponse = await fetch(
      `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/video/${videoId}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e",
          "x-rapidapi-host": "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com",
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!metadataResponse.ok) {
      console.error("❌ [DOWNLOAD] TikTok RapidAPI error:", metadataResponse.status);
      return null;
    }

    const metadata = await metadataResponse.json();
    const videoData = metadata.data?.aweme_detail?.video;
    const videoUrls = videoData?.play_addr?.url_list;

    if (!videoUrls || videoUrls.length === 0) {
      console.error("❌ [DOWNLOAD] No video URLs found in TikTok RapidAPI response");
      return null;
    }

    console.log("🔗 [DOWNLOAD] TikTok video URLs found:", videoUrls.length, "options");

    // Try each video URL
    for (let i = 0; i < videoUrls.length; i++) {
      const videoUrl = videoUrls[i];

      try {
        const videoController = new AbortController();
        const videoTimeoutId = setTimeout(() => videoController.abort(), 15000);

        const videoResponse = await fetch(videoUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          signal: videoController.signal,
        });

        clearTimeout(videoTimeoutId);

        if (videoResponse.ok) {
          const buffer = await videoResponse.arrayBuffer();
          const size = buffer.byteLength;
          const mimeType = videoResponse.headers.get("content-type") ?? "video/mp4";

          console.log(`✅ [DOWNLOAD] Successfully downloaded from RapidAPI URL ${i + 1}`);

          return {
            buffer,
            size,
            mimeType,
            filename: `tiktok-${videoId}.mp4`,
          };
        }
      } catch (error) {
        console.log(`❌ [DOWNLOAD] RapidAPI URL ${i + 1} failed:`, error);
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("⏰ [DOWNLOAD] TikTok RapidAPI timed out after 30 seconds");
    } else {
      console.error("❌ [DOWNLOAD] TikTok RapidAPI error:", error);
    }
    return null;
  }
}

export async function downloadTikTokDirectFallback(
  url: string,
  videoId: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log("🔄 [DOWNLOAD] Attempting TikTok direct fallback...");

    const fallbackUrls = [`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`];

    for (const fallbackUrl of fallbackUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(fallbackUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          const possibleVideoPaths = [
            data.thumbnail_url?.replace("jpg", "mp4"),
            data.video_url,
            data.aweme_detail?.video?.play_addr?.url_list?.[0],
          ];

          for (const videoUrl of possibleVideoPaths) {
            if (videoUrl && typeof videoUrl === "string") {
              try {
                const videoResponse = await fetch(videoUrl, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
                  },
                });

                if (videoResponse.ok && videoResponse.headers.get("content-type")?.includes("video")) {
                  const buffer = await videoResponse.arrayBuffer();
                  const size = buffer.byteLength;

                  if (size > 1000) {
                    console.log("✅ [DOWNLOAD] Fallback video download successful");
                    return {
                      buffer,
                      size,
                      mimeType: "video/mp4",
                      filename: `tiktok-fallback-${videoId}.mp4`,
                    };
                  }
                }
              } catch (videoError) {
                console.log("❌ [DOWNLOAD] Fallback video URL failed:", videoError);
              }
            }
          }
        }
      } catch (error) {
        console.log("❌ [DOWNLOAD] Fallback URL failed:", error);
      }
    }

    return null;
  } catch (error) {
    console.error("❌ [DOWNLOAD] TikTok fallback error:", error);
    return null;
  }
}

export async function downloadTikTokViaScraper(
  url: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log("🔄 [DOWNLOAD] Attempting TikTok scraper library download...");

    const timeoutMs = 30000;

    const video = await Promise.race([
      fetchVideo(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Scraper timeout")), timeoutMs)),
    ]);

    if (!video) {
      console.error("❌ [DOWNLOAD] TikTok scraper returned no video data");
      return null;
    }

    const buffer = await (video as any).download();

    if (!buffer || buffer.length === 0) {
      console.error("❌ [DOWNLOAD] TikTok scraper returned empty buffer");
      return null;
    }

    const size = buffer.length;
    console.log("✅ [DOWNLOAD] TikTok scraper download successful");

    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    return {
      buffer: arrayBuffer,
      size,
      mimeType: "video/mp4",
      filename: `tiktok-scraper-${Date.now()}.mp4`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Scraper timeout") {
      console.log("⏰ [DOWNLOAD] TikTok scraper timed out after 30 seconds");
    } else {
      console.error("❌ [DOWNLOAD] TikTok scraper error:", error);
    }
    return null;
  }
}

export async function downloadInstagramViaRapidAPI(
  shortcode: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log("🌐 [DOWNLOAD] Calling Instagram RapidAPI with 30s timeout...");

    const metadataResponse = await fetch(
      `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reel_by_shortcode?shortcode=${shortcode}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e",
          "x-rapidapi-host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com",
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!metadataResponse.ok) {
      console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", metadataResponse.status);
      return null;
    }

    const metadata = await metadataResponse.json();
    const videoVersions = metadata.video_versions;

    if (!videoVersions || videoVersions.length === 0) {
      console.error("❌ [DOWNLOAD] No video versions found in Instagram RapidAPI response");
      return null;
    }

    console.log("🔗 [DOWNLOAD] Instagram video versions found:", videoVersions.length, "options");

    // Try video versions, starting with the smallest
    for (let i = videoVersions.length - 1; i >= 0; i--) {
      const videoVersion = videoVersions[i];
      const videoUrl = videoVersion.url;

      try {
        const videoController = new AbortController();
        const videoTimeoutId = setTimeout(() => videoController.abort(), 15000);

        const videoResponse = await fetch(videoUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          signal: videoController.signal,
        });

        clearTimeout(videoTimeoutId);

        if (videoResponse.ok) {
          const buffer = await videoResponse.arrayBuffer();
          const size = buffer.byteLength;
          const mimeType = videoResponse.headers.get("content-type") ?? "video/mp4";

          console.log(`✅ [DOWNLOAD] Successfully downloaded from Instagram version ${i + 1}`);

          return {
            buffer,
            size,
            mimeType,
            filename: `instagram-${shortcode}.mp4`,
          };
        }
      } catch (error) {
        console.log(`❌ [DOWNLOAD] Instagram version ${i + 1} failed:`, error);
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("⏰ [DOWNLOAD] Instagram RapidAPI timed out after 30 seconds");
    } else {
      console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", error);
    }
    return null;
  }
}

export async function downloadInstagramDirectFallback(
  url: string,
  shortcode: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  try {
    console.log("🔄 [DOWNLOAD] Attempting Instagram direct fallback...");

    const fallbackUrls = [
      `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`,
      `https://www.instagram.com/reel/${shortcode}/?__a=1&__d=dis`,
    ];

    for (const fallbackUrl of fallbackUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(fallbackUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
            Accept: "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          const possibleVideoPaths = [
            data.graphql?.shortcode_media?.video_url,
            data.items?.[0]?.video_versions?.[0]?.url,
            data.media?.video_url,
            data.video_url,
          ];

          for (const videoUrl of possibleVideoPaths) {
            if (videoUrl && typeof videoUrl === "string") {
              try {
                const videoResponse = await fetch(videoUrl, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
                  },
                });

                if (videoResponse.ok && videoResponse.headers.get("content-type")?.includes("video")) {
                  const buffer = await videoResponse.arrayBuffer();
                  const size = buffer.byteLength;

                  if (size > 1000) {
                    console.log("✅ [DOWNLOAD] Instagram fallback video download successful");
                    return {
                      buffer,
                      size,
                      mimeType: "video/mp4",
                      filename: `instagram-fallback-${shortcode}.mp4`,
                    };
                  }
                }
              } catch (videoError) {
                console.log("❌ [DOWNLOAD] Instagram fallback video URL failed:", videoError);
              }
            }
          }
        }
      } catch (error) {
        console.log("❌ [DOWNLOAD] Instagram fallback URL failed:", error);
      }
    }

    return null;
  } catch (error) {
    console.error("❌ [DOWNLOAD] Instagram fallback error:", error);
    return null;
  }
}
