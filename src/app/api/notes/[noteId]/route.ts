import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { authenticateWithFirebaseToken } from "@/lib/firebase-auth-helpers";
import { notesService, UpdateNoteData } from "@/lib/services/notes-service";

interface RouteParams {
  params: Promise<{
    noteId: string;
  }>;
}

async function authenticateRequest(request: NextRequest) {
  console.log("📋 [Notes API] Authenticating individual note request");

  // Try API key authentication first
  const authHeader = request.headers.get("authorization");
  console.log(
    "🔍 [Notes API] Authorization header:",
    authHeader ? "Bearer " + authHeader.substring(7, 20) + "..." : "none",
  );

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token.startsWith("gencbeta_")) {
      // This is an API key
      console.log("🔑 [Notes API] Using API key authentication");
      return await authenticateApiKey(request);
    } else {
      // This is a Firebase token
      console.log("🔥 [Notes API] Using Firebase token authentication");
      try {
        return await authenticateWithFirebaseToken(token);
      } catch (error) {
        console.error("❌ [Notes API] Firebase auth error:", error);
        return NextResponse.json({ error: "Firebase authentication failed" }, { status: 401 });
      }
    }
  }

  // Try x-api-key header
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    console.log("🗝️ [Notes API] Using x-api-key authentication");
    return await authenticateApiKey(request);
  }

  console.log("❌ [Notes API] No valid authentication found");
  return NextResponse.json({ error: "Authorization required" }, { status: 401 });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { noteId } = await params;
    console.log("📝 [Notes API] GET individual note request received for ID:", noteId);

    // Authenticate user with dual auth support
    const authResult = await authenticateRequest(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Get the note
    const note = await notesService.getNote(noteId, user.uid);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { noteId } = await params;

    // Authenticate user with dual auth support
    const authResult = await authenticateRequest(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Parse request body
    const body = await request.json();
    const updates: UpdateNoteData = body;

    // Update the note
    await notesService.updateNote(noteId, user.uid, updates);

    // Fetch the updated note to return
    const updatedNote = await notesService.getNote(noteId, user.uid);

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { noteId } = await params;

    // Authenticate user with dual auth support
    const authResult = await authenticateRequest(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Delete the note
    await notesService.deleteNote(noteId, user.uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
