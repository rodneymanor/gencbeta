import { NextRequest, NextResponse } from "next/server";

import { authenticateWithFirebaseToken } from "@/lib/firebase-auth-helpers";
import { notesService, CreateNoteData, NotesFilter } from "@/lib/services/notes-service";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateWithFirebaseToken(request);

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
    // Authenticate user
    const authResult = await authenticateWithFirebaseToken(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Parse request body
    const body = await request.json();
    const { title, content, tags, type, starred, audioUrl, duration }: CreateNoteData = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

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

    // Fetch the created note to return
    const createdNote = await notesService.getNote(noteId, user.uid);

    return NextResponse.json({ note: createdNote }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
