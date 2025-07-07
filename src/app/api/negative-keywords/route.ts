import { NextRequest, NextResponse } from "next/server";

import { NegativeKeywordSettings } from "@/data/negative-keywords";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { NegativeKeywordsService } from "@/lib/negative-keywords-service";

interface NegativeKeywordsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// GET: Fetch user's negative keyword settings
export async function GET(request: NextRequest): Promise<NextResponse<NegativeKeywordsResponse>> {
  try {
    console.log("🔍 [NegativeKeywords API] GET request received");

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;
    console.log("👤 [NegativeKeywords API] Fetching settings for user:", userId);

    const settings = await NegativeKeywordsService.getUserNegativeKeywords(userId);

    console.log("✅ [NegativeKeywords API] Settings fetched successfully");

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("❌ [NegativeKeywords API] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch negative keyword settings",
      },
      { status: 500 },
    );
  }
}

// PUT: Update user's negative keyword settings
export async function PUT(request: NextRequest): Promise<NextResponse<NegativeKeywordsResponse>> {
  try {
    console.log("🔧 [NegativeKeywords API] PUT request received");

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;
    const body = await request.json();

    // Validate request body
    if (!body.settings) {
      return NextResponse.json(
        {
          success: false,
          error: "Settings are required",
        },
        { status: 400 },
      );
    }

    console.log("💾 [NegativeKeywords API] Updating settings for user:", userId);

    const updatedSettings = await NegativeKeywordsService.updateUserNegativeKeywords(
      userId,
      body.settings as NegativeKeywordSettings,
    );

    console.log("✅ [NegativeKeywords API] Settings updated successfully");

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    console.error("❌ [NegativeKeywords API] PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update negative keyword settings",
      },
      { status: 500 },
    );
  }
}

// POST: Add custom keyword or toggle default keyword
export async function POST(request: NextRequest): Promise<NextResponse<NegativeKeywordsResponse>> {
  try {
    console.log("➕ [NegativeKeywords API] POST request received");

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;
    const body = await request.json();

    // Validate request body
    if (!body.action || !body.keyword) {
      return NextResponse.json(
        {
          success: false,
          error: "Action and keyword are required",
        },
        { status: 400 },
      );
    }

    const { action, keyword } = body;
    let result;

    switch (action) {
      case "add_custom":
        console.log("➕ [NegativeKeywords API] Adding custom keyword:", keyword);
        result = await NegativeKeywordsService.addCustomKeyword(userId, keyword);
        break;

      case "remove_custom":
        console.log("➖ [NegativeKeywords API] Removing custom keyword:", keyword);
        result = await NegativeKeywordsService.removeCustomKeyword(userId, keyword);
        break;

      case "toggle_default":
        console.log("🔄 [NegativeKeywords API] Toggling default keyword:", keyword);
        result = await NegativeKeywordsService.toggleDefaultKeyword(userId, keyword);
        break;

      case "reset_to_default":
        console.log("🔄 [NegativeKeywords API] Resetting to default");
        result = await NegativeKeywordsService.resetToDefault(userId);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 },
        );
    }

    console.log("✅ [NegativeKeywords API] Action completed successfully");

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ [NegativeKeywords API] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}
