import { NextRequest, NextResponse } from "next/server";

import { SocialProfileService } from "@/core/social/profile-service";
import { authenticateApiKey } from "@/lib/api-key-auth";

interface ProfileRequest {
  url: string;
  includeMetrics?: boolean;
  includeAvatar?: boolean;
  includeBio?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (keeping existing auth)
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProfileRequest = await request.json();

    if (!body.url) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 });
    }

    console.log("👤 [SOCIAL] Fetching social profile:", body.url);

    const result = await SocialProfileService.fetchProfile(body.url, {
      includeMetrics: body.includeMetrics ?? true,
      includeAvatar: body.includeAvatar ?? true,
      includeBio: body.includeBio ?? true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log("✅ [SOCIAL] Profile fetch completed successfully");

    return NextResponse.json({
      success: true,
      profile: result.profile,
    });
  } catch (error) {
    console.error("❌ [SOCIAL] Profile fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch social profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
