import { getAdminDb } from "@/lib/firebase-admin";

interface TranscriptionData {
  transcript?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentMetadata?: any;
  visualContext?: string;
}

export async function updateVideoTranscription(videoId: string, transcriptionData: TranscriptionData) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    // Filter out undefined values to prevent Firestore errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      transcriptionStatus: "completed",
      transcriptionCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Only add fields that are not undefined
    if (transcriptionData.transcript !== undefined) {
      updateData.transcript = transcriptionData.transcript;
    }
    if (transcriptionData.components !== undefined) {
      updateData.components = transcriptionData.components;
    }
    if (transcriptionData.contentMetadata !== undefined) {
      updateData.contentMetadata = transcriptionData.contentMetadata;
    }
    if (transcriptionData.visualContext !== undefined) {
      updateData.visualContext = transcriptionData.visualContext;
    }

    await adminDb.collection("videos").doc(videoId).update(updateData);

    console.log("✅ [VIDEO_UTILS] Video transcription updated:", videoId);
  } catch (error) {
    console.error("❌ [VIDEO_UTILS] Failed to update transcription:", error);
  }
}

export async function updateVideoTranscriptionStatus(videoId: string, status: string) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    await adminDb.collection("videos").doc(videoId).update({
      transcriptionStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [VIDEO_UTILS] Failed to update transcription status:", error);
  }
}
