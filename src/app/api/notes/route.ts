import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { authenticateWithFirebaseToken } from "@/lib/firebase-auth-helpers";
import { notesService, CreateNoteData, NotesFilter } from "@/lib/services/notes-service";

async function authenticateRequest(request: NextRequest) {
  console.log("📋 [Notes API] Authenticating request");

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

export async function GET(request: NextRequest) {
  try {
    // Authenticate user with dual auth support
    const authResult = await authenticateRequest(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filter: NotesFilter = {};

    if (searchParams.get("type")) {
      filter.type = searchParams.get("type") as "text" | "voice" | "idea_inbox";
    }
    if (searchParams.get("starred")) {
      filter.starred = searchParams.get("starred") === "true";
    }
    if (searchParams.get("source")) {
      filter.source = searchParams.get("source") as "manual" | "inbox" | "import";
    }
    if (searchParams.get("limit")) {
      filter.limit = parseInt(searchParams.get("limit")!);
    }
    if (searchParams.get("tags")) {
      filter.tags = searchParams.get("tags")!.split(",");
    }

    const search = searchParams.get("search");

    let notes;
    if (search) {
      notes = await notesService.searchNotes(user.uid, search, filter);
    } else {
      notes = await notesService.getUserNotes(user.uid, filter);
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 [Notes API] POST request received");

    // Authenticate user with dual auth support
    const authResult = await authenticateRequest(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    console.log("📝 [Notes API] User authenticated:", user.uid);

    // Parse request body
    const body = await request.json();
    console.log("📝 [Notes API] Request body:", body);
    const { title, content, tags, type, starred, audioUrl, duration }: CreateNoteData = body;

    // Validate required fields
    if (!title || !content) {
      console.log("❌ [Notes API] Validation failed - missing title or content");
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    console.log("📝 [Notes API] Creating note:", { title, content, type });
    // Create the note
    const noteId = await notesService.createNote(user.uid, {
      title,
      content,
      tags: tags || [],
      type: type || "text",
      starred: starred || false,
      audioUrl,
      duration,
    });

    console.log("✅ [Notes API] Note created with ID:", noteId);

    // Fetch the created note to return
    const createdNote = await notesService.getNote(noteId, user.uid);
    console.log("📝 [Notes API] Created note retrieved:", createdNote);

    return NextResponse.json({ note: createdNote }, { status: 201 });
  } catch (error) {
    console.error("❌ [Notes API] Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
