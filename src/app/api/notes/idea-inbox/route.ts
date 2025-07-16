import { NextRequest, NextResponse } from "next/server";

import { authenticateWithFirebaseToken } from "@/lib/firebase-auth-helpers";
import { notesService } from "@/lib/services/notes-service";

/**
 * API endpoint for getting notes suitable for idea inbox integration
 * Returns starred notes and notes tagged for idea generation
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateWithFirebaseToken(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Get notes suitable for idea inbox
    const ideaInboxNotes = await notesService.getIdeaInboxNotes(user.uid);

    return NextResponse.json({
      notes: ideaInboxNotes,
      count: ideaInboxNotes.length,
    });
  } catch (error) {
    console.error("Error fetching idea inbox notes:", error);
    return NextResponse.json({ error: "Failed to fetch idea inbox notes" }, { status: 500 });
  }
}
