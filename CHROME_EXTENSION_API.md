# Chrome Extension API Documentation

This document provides comprehensive information about the API endpoints designed for Chrome extension integration with the Gen C platform.

## Table of Contents

1. [Authentication](#authentication)
2. [Notes API](#notes-api)
3. [YouTube Transcript API](#youtube-transcript-api)
4. [Existing Collections API](#existing-collections-api)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)
7. [Chrome Extension Integration Examples](#chrome-extension-integration-examples)

## Authentication

All Chrome extension API endpoints use **API Key Authentication** for secure access.

### API Key Format

```
gencbeta_<your-api-key>
```

### Authentication Methods

You can authenticate using either of these header formats:

**Option 1: x-api-key Header**

```javascript
headers: {
  'x-api-key': 'gencbeta_your_api_key_here',
  'Content-Type': 'application/json'
}
```

**Option 2: Authorization Bearer Header**

```javascript
headers: {
  'Authorization': 'Bearer gencbeta_your_api_key_here',
  'Content-Type': 'application/json'
}
```

### Rate Limiting

- **50 requests per minute** per API key
- Violations trigger escalating lockouts:
  - 1st violation: 5-minute lockout
  - 2nd violation: 15-minute lockout
  - 3rd violation: 60-minute lockout
- Violation tracking resets after 24 hours

### Getting Your API Key

Contact your system administrator or generate an API key through the Gen C dashboard settings.

## Notes API

The Notes API allows Chrome extensions to create, read, update, and delete notes with rich metadata support.

### Base URL

```
https://gencapp.pro/api/chrome-extension/notes
```

### Note Types

- `text` - Plain text notes
- `youtube` - YouTube video notes with transcript
- `webpage` - Web page content notes
- `video` - General video content notes
- `voice` - Voice notes with transcribed text and token usage tracking

### Endpoints

#### GET /api/chrome-extension/notes

Retrieve notes for the authenticated user.

**Query Parameters:**

- `limit` (optional): Number of notes to return (default: 50, max: 100)
- `type` (optional): Filter by note type (`text`, `youtube`, `webpage`, `video`, `voice`)
- `search` (optional): Search in title and content
- `tags` (optional): Comma-separated tags to filter by

**Example Request:**

```javascript
const response = await fetch("/api/chrome-extension/notes?limit=20&type=youtube&search=tutorial", {
  headers: {
    "x-api-key": "gencbeta_your_api_key_here",
  },
});
```

**Example Response:**

```json
{
  "success": true,
  "notes": [
    {
      "id": "note_123",
      "title": "React Tutorial - Hooks",
      "content": "Comprehensive guide to React hooks...",
      "url": "https://youtube.com/watch?v=abc123",
      "type": "youtube",
      "tags": ["react", "hooks", "tutorial"],
      "metadata": {
        "domain": "youtube.com",
        "videoId": "abc123",
        "duration": 1800,
        "channelName": "React Academy",
        "publishedAt": "2024-01-15T10:00:00Z"
      },
      "createdAt": "2024-01-20T10:30:00Z",
      "updatedAt": "2024-01-20T10:30:00Z",
      "userId": "user_456"
    }
  ],
  "count": 1
}
```

#### POST /api/chrome-extension/notes

Create a new note.

**Request Body:**

```json
{
  "title": "My Note Title",
  "content": "Note content here...",
  "url": "https://example.com", // optional
  "type": "text", // optional, default: "text"
  "tags": ["tag1", "tag2"], // optional
  "metadata": {
    // optional
    "domain": "example.com",
    "favicon": "https://example.com/favicon.ico"
  }
}
```

**Voice Note Request Body:**

```json
{
  "title": "Voice Note - Meeting Summary",
  "content": "Transcribed text from voice note...",
  "type": "voice",
  "tags": ["voice", "meeting"],
  "metadata": {
    "voiceMetadata": {
      "originalAudioDuration": 120.5,
      "transcriptionService": "gemini",
      "inputTokens": 150,
      "outputTokens": 300,
      "totalTokens": 450,
      "language": "en",
      "confidence": 0.95
    }
  }
}
```

**Example Request:**

```javascript
const response = await fetch("/api/chrome-extension/notes", {
  method: "POST",
  headers: {
    "x-api-key": "gencbeta_your_api_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Important Meeting Notes",
    content: "Key points from today's meeting:\n- Budget approved\n- New hire next month",
    type: "text",
    tags: ["meeting", "work"],
  }),
});
```

#### PUT /api/chrome-extension/notes

Update an existing note.

**Request Body:**

```json
{
  "noteId": "note_123",
  "title": "Updated Title", // optional
  "content": "Updated content", // optional
  "tags": ["new", "tags"], // optional
  "metadata": {} // optional
}
```

#### DELETE /api/chrome-extension/notes

Delete a note.

**Query Parameters:**

- `noteId` (required): ID of the note to delete

**Example Request:**

```javascript
const response = await fetch("/api/chrome-extension/notes?noteId=note_123", {
  method: "DELETE",
  headers: {
    "x-api-key": "gencbeta_your_api_key_here",
  },
});
```

## YouTube Transcript API

Extract transcripts from YouTube videos and optionally save them as notes.

### Base URL

```
https://gencapp.pro/api/chrome-extension/youtube-transcript
```

### Endpoints

#### POST /api/chrome-extension/youtube-transcript

Extract transcript and optionally save as note.

**Request Body:**

```json
{
  "url": "https://youtube.com/watch?v=abc123",
  "saveAsNote": true, // optional, default: false
  "includeTimestamps": false, // optional, default: false
  "language": "en" // optional, default: "en"
}
```

**Example Request:**

```javascript
const response = await fetch("/api/chrome-extension/youtube-transcript", {
  method: "POST",
  headers: {
    "x-api-key": "gencbeta_your_api_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    saveAsNote: true,
    includeTimestamps: true,
  }),
});
```

**Example Response:**

```json
{
  "success": true,
  "transcript": "[0:00] Welcome to this tutorial [0:05] Today we'll learn about...",
  "segments": [
    {
      "text": "Welcome to this tutorial",
      "start": 0,
      "duration": 3.5
    },
    {
      "text": "Today we'll learn about",
      "start": 5,
      "duration": 4.2
    }
  ],
  "metadata": {
    "videoId": "dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "channelName": "RickAstleyVEVO",
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  },
  "note": {
    "id": "note_789",
    "title": "Never Gonna Give You Up",
    "content": "# Never Gonna Give You Up\n\n**Channel:** RickAstleyVEVO...",
    "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "type": "youtube",
    "metadata": {
      "videoId": "dQw4w9WgXcQ",
      "domain": "youtube.com",
      "transcriptLength": 1500,
      "segmentCount": 45
    },
    "createdAt": "2024-01-20T10:30:00Z",
    "updatedAt": "2024-01-20T10:30:00Z",
    "userId": "user_456"
  }
}
```

#### GET /api/chrome-extension/youtube-transcript

Quick transcript extraction without saving.

**Query Parameters:**

- `url` (required): YouTube video URL
- `includeTimestamps` (optional): Include timestamps in transcript
- `language` (optional): Language code (default: "en")

**Example Request:**

```javascript
const response = await fetch(
  "/api/chrome-extension/youtube-transcript?url=https://youtube.com/watch?v=abc123&includeTimestamps=true",
  {
    headers: {
      "x-api-key": "gencbeta_your_api_key_here",
    },
  },
);
```

### Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

## Existing Collections API

These endpoints allow Chrome extensions to work with video collections.

### Base URLs and Endpoints

#### GET /api/collections

List all collections for authenticated user.

```javascript
const response = await fetch("https://gencapp.pro/api/collections", {
  headers: {
    "x-api-key": "gencbeta_your_api_key_here",
  },
});
```

#### GET /api/list-collections

Simple collections listing.

```javascript
const response = await fetch("https://gencapp.pro/api/list-collections", {
  headers: {
    "x-api-key": "gencbeta_your_api_key_here",
  },
});
```

#### POST /api/add-video-to-collection

Add a video to a collection.

**Request Body:**

```json
{
  "url": "https://youtube.com/watch?v=abc123",
  "collectionId": "collection_456"
}
```

```javascript
const response = await fetch("https://gencapp.pro/api/add-video-to-collection", {
  method: "POST",
  headers: {
    "x-api-key": "gencbeta_your_api_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://youtube.com/watch?v=abc123",
    collectionId: "collection_456",
  }),
});
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/missing API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Rate Limit Headers

When rate limited, responses include:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642780800
```

## Voice Notes and Token Usage Tracking

Voice notes are a special type of note that includes transcribed text from audio recordings. When creating voice notes, the system automatically tracks token usage for billing and analytics purposes.

### Voice Note Features

- **Automatic Token Tracking**: Records input/output tokens used during transcription
- **Monthly Usage Statistics**: Aggregates usage data by user and month
- **Audio Duration Tracking**: Records original audio length for analytics
- **Service Attribution**: Tracks which transcription service was used (e.g., "gemini")
- **Confidence Scoring**: Optional confidence level from transcription service

### Token Usage Storage

The system stores token usage in two collections:

1. **Detailed Usage** (`voice_note_token_usage`): Individual transcription records
2. **Monthly Summaries** (`user_voice_stats`): Aggregated monthly statistics per user

### Data Stored for Voice Notes

```json
{
  "noteId": "note_abc123",
  "service": "gemini",
  "inputTokens": 150,
  "outputTokens": 300,
  "totalTokens": 450,
  "audioDuration": 120.5,
  "language": "en",
  "confidence": 0.95,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Chrome Extension Integration Examples

### Content Script Example

```javascript
// content-script.js
class GenCExtension {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://gencapp.pro/api/chrome-extension";
  }

  async createNote(title, content, url = null, type = "text", tags = [], metadata = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/notes`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          url,
          type,
          tags,
          metadata: {
            domain: url ? new URL(url).hostname : undefined,
            capturedAt: new Date().toISOString(),
            ...metadata,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log("Note created:", result.note.id);
        return result.note;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      throw error;
    }
  }

  async createVoiceNote(title, transcribedText, voiceMetadata = {}) {
    try {
      return await this.createNote(title, transcribedText, null, "voice", ["voice", "transcribed"], { voiceMetadata });
    } catch (error) {
      console.error("Failed to create voice note:", error);
      throw error;
    }
  }

  async extractYouTubeTranscript(url, saveAsNote = true) {
    try {
      const response = await fetch(`${this.baseUrl}/youtube-transcript`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          saveAsNote,
          includeTimestamps: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log("Transcript extracted:", result.transcript.length, "characters");
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to extract transcript:", error);
      throw error;
    }
  }

  async getNotes(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${this.baseUrl}/notes?${params}`, {
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      const result = await response.json();
      if (result.success) {
        return result.notes;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to get notes:", error);
      throw error;
    }
  }
}

// Usage
const genC = new GenCExtension("gencbeta_your_api_key_here");

// Create a note from current page
genC.createNote(document.title, window.getSelection().toString() || "Saved page", window.location.href, "webpage", [
  "bookmark",
  "chrome-extension",
]);

// Extract YouTube transcript if on YouTube
if (window.location.hostname.includes("youtube.com")) {
  genC.extractYouTubeTranscript(window.location.href, true);
}

// Example: Create voice note with Gemini transcription
async function createVoiceNoteFromAudio(audioBlob, title = "Voice Note") {
  try {
    // This would be your Gemini API integration
    const transcriptionResult = await transcribeWithGemini(audioBlob);

    await genC.createVoiceNote(title, transcriptionResult.text, {
      originalAudioDuration: transcriptionResult.duration,
      transcriptionService: "gemini",
      inputTokens: transcriptionResult.inputTokens,
      outputTokens: transcriptionResult.outputTokens,
      totalTokens: transcriptionResult.totalTokens,
      language: transcriptionResult.language || "en",
      confidence: transcriptionResult.confidence,
    });
  } catch (error) {
    console.error("Failed to create voice note:", error);
  }
}
```

### Background Script Example

```javascript
// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToGenC",
    title: "Save to Gen C",
    contexts: ["selection", "page"],
  });

  chrome.contextMenus.create({
    id: "extractTranscript",
    title: "Extract YouTube Transcript",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtube.com/*"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const apiKey = await getApiKey(); // Get from storage
  const genC = new GenCExtension(apiKey);

  switch (info.menuItemId) {
    case "saveToGenC":
      await genC.createNote(tab.title, info.selectionText || "Saved page", tab.url, "webpage", ["context-menu"]);
      break;

    case "extractTranscript":
      if (tab.url.includes("youtube.com")) {
        await genC.extractYouTubeTranscript(tab.url, true);
      }
      break;
  }
});
```

### Popup Interface Example

```javascript
// popup.js
document.addEventListener("DOMContentLoaded", async () => {
  const apiKey = await getApiKey();
  const genC = new GenCExtension(apiKey);

  // Load recent notes
  const notes = await genC.getNotes({ limit: 10 });
  displayNotes(notes);

  // Quick note form
  document.getElementById("saveNote").addEventListener("click", async () => {
    const title = document.getElementById("noteTitle").value;
    const content = document.getElementById("noteContent").value;

    if (title && content) {
      await genC.createNote(title, content, null, "text", ["popup"]);
      // Refresh notes list
      const updatedNotes = await genC.getNotes({ limit: 10 });
      displayNotes(updatedNotes);
    }
  });
});

function displayNotes(notes) {
  const container = document.getElementById("notesList");
  container.innerHTML = notes
    .map(
      (note) => `
    <div class="note-item">
      <h4>${note.title}</h4>
      <p>${note.content.substring(0, 100)}...</p>
      <small>${new Date(note.createdAt).toLocaleDateString()}</small>
    </div>
  `,
    )
    .join("");
}
```

This comprehensive API documentation provides everything needed to integrate the Gen C platform with Chrome extensions, including authentication, all available endpoints, error handling, and practical integration examples.
