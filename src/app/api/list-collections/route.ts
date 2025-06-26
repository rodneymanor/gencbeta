import { NextRequest, NextResponse } from "next/server";

import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { formatTimestamp } from "@/lib/collections-helpers";
import { db } from "@/lib/firebase";

// Simple API key authentication
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all collections
    const q = query(collection(db, "collections"), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);

    const collections = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title,
      description: doc.data().description,
      userId: doc.data().userId,
      videoCount: doc.data().videoCount ?? 0,
      createdAt: formatTimestamp(doc.data().createdAt),
      updatedAt: formatTimestamp(doc.data().updatedAt),
    }));

    return NextResponse.json({
      success: true,
      collections,
      total: collections.length,
    });
  } catch (error) {
    console.error("Error listing collections:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
