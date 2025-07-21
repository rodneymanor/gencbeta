/**
 * Notes service for managing user notes and ideas
 * Provides CRUD operations and integration with idea inbox
 */

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  type: "text" | "voice" | "idea_inbox";
  source?: "manual" | "inbox" | "import";
  starred: boolean;
  audioUrl?: string;
  duration?: number;
  metadata?: {
    videoId?: string;
    channelName?: string;
    channelId?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    viewCount?: number;
    publishedAt?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteData {
  title: string;
  content: string;
  tags?: string[];
  type?: "text" | "voice" | "idea_inbox";
  source?: "manual" | "inbox" | "import";
  starred?: boolean;
  audioUrl?: string;
  duration?: number;
  metadata?: {
    videoId?: string;
    channelName?: string;
    channelId?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    viewCount?: number;
    publishedAt?: string;
  };
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  tags?: string[];
  starred?: boolean;
  audioUrl?: string;
  duration?: number;
}

export interface NotesFilter {
  tags?: string[];
  type?: "text" | "voice" | "idea_inbox";
  starred?: boolean;
  source?: "manual" | "inbox" | "import";
  limit?: number;
}

class NotesService {
  private collectionName = "notes";

  /**
   * Get all notes for a user with optional filtering
   */
  async getUserNotes(userId: string, filter: NotesFilter = {}): Promise<Note[]> {
    try {
      let query = adminDb.collection(this.collectionName).where("userId", "==", userId);

      // Apply filters
      if (filter.type) {
        query = query.where("type", "==", filter.type);
      }
      if (filter.starred !== undefined) {
        query = query.where("starred", "==", filter.starred);
      }
      if (filter.source) {
        query = query.where("source", "==", filter.source);
      }

      const snapshot = await query.get();
      const notes: Note[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          type: data.type || "text",
          source: data.source || "manual",
          starred: data.starred || false,
          audioUrl: data.audioUrl,
          duration: data.duration,
          metadata: data.metadata,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      // Filter by tags if specified (Firestore doesn't support array-contains-any with other filters)
      let filteredNotes = notes;
      if (filter.tags && filter.tags.length > 0) {
        filteredNotes = notes.filter((note) => filter.tags!.some((tag) => note.tags.includes(tag)));
      }

      // Sort by updatedAt in memory (descending - newest first)
      filteredNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      // Apply limit after sorting
      if (filter.limit) {
        filteredNotes = filteredNotes.slice(0, filter.limit);
      }

      return filteredNotes;
    } catch (error) {
      console.error("Error fetching user notes:", error);
      throw new Error("Failed to fetch notes");
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNote(noteId: string, userId: string): Promise<Note | null> {
    try {
      const noteRef = adminDb.collection(this.collectionName).doc(noteId);
      const snapshot = await noteRef.get();

      if (!snapshot.exists) {
        return null;
      }

      const data = snapshot.data();

      // Verify the note belongs to the user
      if (data.userId !== userId) {
        throw new Error("Unauthorized access to note");
      }

      return {
        id: snapshot.id,
        userId: data.userId,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        type: data.type || "text",
        source: data.source || "manual",
        starred: data.starred || false,
        audioUrl: data.audioUrl,
        duration: data.duration,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error("Error fetching note:", error);
      throw new Error("Failed to fetch note");
    }
  }

  /**
   * Create a new note
   */
  async createNote(userId: string, noteData: CreateNoteData): Promise<string> {
    try {
      const now = FieldValue.serverTimestamp();
      const noteDoc: any = {
        userId,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags || [],
        type: noteData.type || "text",
        source: noteData.source || "manual",
        starred: noteData.starred || false,
        createdAt: now,
        updatedAt: now,
      };

      // Only add optional fields if they have values (avoid undefined)
      if (noteData.audioUrl) {
        noteDoc.audioUrl = noteData.audioUrl;
      }
      if (noteData.duration !== undefined) {
        noteDoc.duration = noteData.duration;
      }
      if (noteData.metadata) {
        noteDoc.metadata = noteData.metadata;
      }

      const docRef = await adminDb.collection(this.collectionName).add(noteDoc);
      return docRef.id;
    } catch (error) {
      console.error("Error creating note:", error);
      throw new Error("Failed to create note");
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, userId: string, updates: UpdateNoteData): Promise<void> {
    try {
      const noteRef = adminDb.collection(this.collectionName).doc(noteId);

      // Verify the note exists and belongs to the user
      const existingNote = await this.getNote(noteId, userId);
      if (!existingNote) {
        throw new Error("Note not found or unauthorized");
      }

      const updateData = {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await noteRef.update(updateData);
    } catch (error) {
      console.error("Error updating note:", error);
      throw new Error("Failed to update note");
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, userId: string): Promise<void> {
    try {
      // Verify the note exists and belongs to the user
      const existingNote = await this.getNote(noteId, userId);
      if (!existingNote) {
        throw new Error("Note not found or unauthorized");
      }

      const noteRef = adminDb.collection(this.collectionName).doc(noteId);
      await noteRef.delete();
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error("Failed to delete note");
    }
  }

  /**
   * Get notes specifically for idea inbox (starred and suitable for prompts)
   */
  async getIdeaInboxNotes(userId: string): Promise<Note[]> {
    return this.getUserNotes(userId, {
      starred: true,
      limit: 50, // Reasonable limit for UI selection
    });
  }

  /**
   * Search notes by content and title
   */
  async searchNotes(userId: string, searchTerm: string, filter: NotesFilter = {}): Promise<Note[]> {
    try {
      // Get all user notes with filter
      const allNotes = await this.getUserNotes(userId, filter);

      // Filter by search term (case-insensitive)
      const searchLower = searchTerm.toLowerCase();
      return allNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    } catch (error) {
      console.error("Error searching notes:", error);
      throw new Error("Failed to search notes");
    }
  }

  /**
   * Get unique tags for a user
   */
  async getUserTags(userId: string): Promise<string[]> {
    try {
      const notes = await this.getUserNotes(userId);
      const tagSet = new Set<string>();

      notes.forEach((note) => {
        note.tags.forEach((tag) => tagSet.add(tag));
      });

      return Array.from(tagSet).sort();
    } catch (error) {
      console.error("Error fetching user tags:", error);
      throw new Error("Failed to fetch tags");
    }
  }

  /**
   * Bulk import notes (for idea inbox integration)
   */
  async bulkImportNotes(userId: string, notes: CreateNoteData[]): Promise<string[]> {
    try {
      const createdIds: string[] = [];

      for (const noteData of notes) {
        const noteId = await this.createNote(userId, {
          ...noteData,
          source: "import",
        });
        createdIds.push(noteId);
      }

      return createdIds;
    } catch (error) {
      console.error("Error bulk importing notes:", error);
      throw new Error("Failed to import notes");
    }
  }
}

export const notesService = new NotesService();
