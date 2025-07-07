import { NextRequest, NextResponse } from "next/server";

import { SAMPLE_VOICES } from "@/data/sample-voices";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    console.log("[InitSampleVoices] Starting sample voices initialization");

    // Check if sample voices already exist
    const existingVoicesSnapshot = await adminDb.collection("aiVoices").where("isShared", "==", true).get();

    if (!existingVoicesSnapshot.empty) {
      console.log("[InitSampleVoices] Sample voices already exist, skipping initialization");
      return NextResponse.json({
        success: true,
        message: "Sample voices already initialized",
        count: existingVoicesSnapshot.size,
      });
    }

    // Initialize sample voices
    const batch = adminDb.batch();
    let addedCount = 0;

    for (const voice of SAMPLE_VOICES) {
      const { id, ...voiceData } = voice;
      const docRef = adminDb.collection("aiVoices").doc(id);
      batch.set(docRef, voiceData);
      addedCount++;
    }

    await batch.commit();

    console.log(`[InitSampleVoices] Successfully initialized ${addedCount} sample voices`);

    return NextResponse.json({
      success: true,
      message: `Successfully initialized ${addedCount} sample voices`,
      count: addedCount,
    });
  } catch (error) {
    console.error("[InitSampleVoices] Failed to initialize sample voices:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize sample voices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
