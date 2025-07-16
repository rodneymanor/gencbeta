import { NextRequest, NextResponse } from "next/server";

import { authenticateWithFirebaseToken } from "@/lib/firebase-auth-helpers";
import { notesService, UpdateNoteData } from "@/lib/services/notes-service";

interface RouteParams {
  params: {
    noteId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const authResult = await authenticateWithFirebaseToken(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { noteId } = params;

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
    // Authenticate user
    const authResult = await authenticateWithFirebaseToken(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { noteId } = params;

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
    // Authenticate user
    const authResult = await authenticateWithFirebaseToken(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { noteId } = params;

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
