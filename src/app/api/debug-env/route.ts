import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Check API key
  const apiKey = request.headers.get("x-api-key");
  // eslint-disable-next-line security/detect-possible-timing-attacks
  if (apiKey !== "s7Sl*g94bPV2OsKM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check environment variables (without exposing sensitive values)
  const envCheck = {
    RAPIDAPI_KEY: !!process.env.RAPIDAPI_KEY,
    RAPIDAPI_KEY_LENGTH: process.env.RAPIDAPI_KEY?.length ?? 0,
    BUNNY_STREAM_LIBRARY_ID: !!process.env.BUNNY_STREAM_LIBRARY_ID,
    BUNNY_STREAM_API_KEY: !!process.env.BUNNY_STREAM_API_KEY,
    BUNNY_CDN_HOSTNAME: !!process.env.BUNNY_CDN_HOSTNAME,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    success: true,
    environment: envCheck,
    timestamp: new Date().toISOString(),
  });
}
