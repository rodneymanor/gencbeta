import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🔄 [DOWNLOAD] Redirecting to new orchestrator service...");

  try {
    const body = await request.json();

    // Get the base URL for internal service calls
    const baseUrl = getBaseUrl(request);

    console.log("🎬 [DOWNLOAD] Calling download-and-prepare orchestrator...");
    console.log("🌐 [DOWNLOAD] Using base URL:", baseUrl);

    // Forward the request to the new orchestrator service
    const response = await fetch(`${baseUrl}/api/video/download-and-prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ [DOWNLOAD] Orchestrator service failed:", response.status);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ [DOWNLOAD] Request forwarded successfully");

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [DOWNLOAD] Redirect error:", error);
    return NextResponse.json(
      {
        error: "Failed to process video download request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  // In production, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // In development, use the request's host to get the correct port
  const host = request.headers.get("host");
  if (host) {
    return `http://${host}`;
  }

  // Fallback to default
  return "http://localhost:3000";
}
