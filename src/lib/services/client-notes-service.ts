/**
 * Client-side notes service for React components
 * Handles authentication automatically and provides type-safe API calls
 */

import { auth } from "@/lib/firebase";

import { Note, CreateNoteData, UpdateNoteData, NotesFilter } from "./notes-service";

interface NotesResponse {
  notes: Note[];
  count?: number;
}

interface NoteResponse {
  note: Note;
}

interface CreateNoteResponse {
  note: Note;
}

class ClientNotesService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get all notes for the current user with optional filtering
   */
  async getNotes(filter: NotesFilter & { search?: string } = {}): Promise<NotesResponse> {
    const headers = await this.getAuthHeaders();

    // Build query parameters
    const params = new URLSearchParams();
    if (filter.type) params.append("type", filter.type);
    if (filter.starred !== undefined) params.append("starred", filter.starred.toString());
    if (filter.source) params.append("source", filter.source);
    if (filter.limit) params.append("limit", filter.limit.toString());
    if (filter.tags) params.append("tags", filter.tags.join(","));
    if (filter.search) params.append("search", filter.search);

    const response = await fetch(`/api/notes?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch notes");
    }

    return response.json();
  }

  /**
   * Get a specific note by ID
   */
  async getNote(noteId: string): Promise<NoteResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`/api/notes/${noteId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch note");
    }

    return response.json();
  }

  /**
   * Create a new note
   */
  async createNote(noteData: CreateNoteData): Promise<CreateNoteResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch("/api/notes", {
      method: "POST",
      headers,
      body: JSON.stringify(noteData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create note");
    }

    return response.json();
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, updates: UpdateNoteData): Promise<NoteResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`/api/notes/${noteId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update note");
    }

    return response.json();
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<{ success: boolean }> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete note");
    }

    return response.json();
  }

  /**
   * Get notes suitable for idea inbox (starred and relevant for prompts)
   */
  async getIdeaInboxNotes(): Promise<NotesResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch("/api/notes/idea-inbox", {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch idea inbox notes");
    }

    return response.json();
  }

  /**
   * Search notes by content and title
   */
  async searchNotes(searchTerm: string, filter: NotesFilter = {}): Promise<NotesResponse> {
    return this.getNotes({ ...filter, search: searchTerm });
  }

  /**
   * Toggle starred status of a note
   */
  async toggleStarred(noteId: string, starred: boolean): Promise<NoteResponse> {
    return this.updateNote(noteId, { starred });
  }

  /**
   * Update note tags
   */
  async updateTags(noteId: string, tags: string[]): Promise<NoteResponse> {
    return this.updateNote(noteId, { tags });
  }
}

export const clientNotesService = new ClientNotesService();
export type { Note, CreateNoteData, UpdateNoteData, NotesFilter } from "./notes-service";
