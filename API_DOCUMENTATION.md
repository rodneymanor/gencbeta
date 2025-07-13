# Video Collection API Documentation

This API allows you to programmatically add videos to collections in your video management system.

## Authentication

All API requests require authentication using an API key passed in the `x-api-key` header.

```bash
x-api-key: your-secret-api-key
```

## Environment Variables

Set the following environment variable in your `.env.local` file:

```
VIDEO_API_KEY=your-secret-api-key
```

## Endpoints

### POST /api/add-video-to-collection

Add a video to an existing collection.

**Headers:**
- `Content-Type: application/json`
- `x-api-key: your-secret-api-key`

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "collectionId": "collection-id-here",
  "title": "Optional video title"
}
```

**Required Fields:**
- `videoUrl`: The URL of the video to add
- `collectionId`: The ID of the collection to add the video to

**Optional Fields:**
- `title`: Custom title for the video (defaults to auto-generated title)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Video added successfully",
  "videoId": "generated-video-id",
  "collectionId": "your-collection-id",
  "video": {
    "id": "generated-video-id",
    "url": "https://example.com/video.mp4",
    "title": "Your video title",
    "platform": "external",
    "userId": "collection-owner-id"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing API key
- `400 Bad Request`: Missing required fields or invalid URL format
- `404 Not Found`: Collection not found
- `500 Internal Server Error`: Server error

### GET /api/add-video-to-collection

Retrieve collection information and videos.

**Headers:**
- `x-api-key: your-secret-api-key`

**Query Parameters:**
- `collectionId`: The ID of the collection to retrieve

**Success Response (200):**
```json
{
  "collection": {
    "id": "collection-id",
    "title": "Collection Title",
    "description": "Collection Description",
    "videoCount": 5
  },
  "videos": [
    {
      "id": "video-id",
      "title": "Video Title",
      "url": "https://example.com/video.mp4",
      "platform": "external",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Usage Examples

### Using cURL

**Add a video:**
```bash
curl -X POST https://your-domain.com/api/add-video-to-collection \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "collectionId": "your-collection-id",
    "title": "My Video Title"
  }'
```

**Get collection info:**
```bash
curl -X GET "https://your-domain.com/api/add-video-to-collection?collectionId=your-collection-id" \
  -H "x-api-key: your-secret-api-key"
```

### Using JavaScript/Node.js

```javascript
const API_BASE_URL = 'https://your-domain.com';
const API_KEY = 'your-secret-api-key';

// Add a video
async function addVideo(videoUrl, collectionId, title) {
  const response = await fetch(`${API_BASE_URL}/api/add-video-to-collection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      videoUrl,
      collectionId,
      title,
    }),
  });

  return await response.json();
}

// Get collection
async function getCollection(collectionId) {
  const response = await fetch(`${API_BASE_URL}/api/add-video-to-collection?collectionId=${collectionId}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
    },
  });

  return await response.json();
}
```

### Using Python

```python
import requests

API_BASE_URL = 'https://your-domain.com'
API_KEY = 'your-secret-api-key'

# Add a video
def add_video(video_url, collection_id, title=None):
    response = requests.post(
        f'{API_BASE_URL}/api/add-video-to-collection',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
        json={
            'videoUrl': video_url,
            'collectionId': collection_id,
            'title': title,
        }
    )
    return response.json()

# Get collection
def get_collection(collection_id):
    response = requests.get(
        f'{API_BASE_URL}/api/add-video-to-collection',
        headers={'x-api-key': API_KEY},
        params={'collectionId': collection_id}
    )
    return response.json()
```

### GET /api/collections

Get all collections for a user.

**Headers:**
- `x-api-key: your-secret-api-key`
- `x-user-id: user-uid-here` (optional, can use query param instead)

**Query Parameters:**
- `userId`: The UID of the user whose collections to retrieve

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-uid",
    "email": "user@example.com",
    "displayName": "User Name",
    "role": "super_admin"
  },
  "collections": [
    {
      "id": "collection-id",
      "title": "Collection Title",
      "description": "Collection Description",
      "videoCount": 5,
      "userId": "collection-owner-uid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing API key
- `400 Bad Request`: Missing userId parameter
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

## Getting Collection IDs

To find collection IDs:

1. **Via API**: Use the `/api/collections` endpoint to list all collections
2. **Via UI**: Go to your collections page and check the URL or browser developer tools
3. **Via Database**: Look in your Firestore `collections` collection

## Security Notes

1. **Keep your API key secret** - never expose it in client-side code
2. **Use HTTPS** in production to protect API key transmission
3. **Consider rate limiting** for production use
4. **Validate video URLs** before adding them to collections

## Error Handling

Always check the response status and handle errors appropriately:

```javascript
const result = await addVideo(videoUrl, collectionId, title);

if (result.error) {
  console.error('API Error:', result.error);
  // Handle error appropriately
} else {
  console.log('Success:', result.message);
  // Process successful response
}
```

## Testing

Use the included `test-api.js` script to test your API:

1. Update the API_KEY and collection ID in the script
2. Run: `node test-api.js`

This will test both adding a video and retrieving collection information. 


----
API Route and Endpoint Flow:
Frontend calls: /api/creators POST route
Backend processing: processCreatorProfile() function in src/lib/process-creator-utils.ts
Platform-specific API calls:
TikTok: https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/user/{username}/feed
Instagram:
Step 1: https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/user_id_by_username?username={username}
Step 2: https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reels?user_id={userId}&include_feed_video=true
Added Logging:
API Call Logging:
🌐 API URLs: Shows exact endpoints being called
📡 Response Status: HTTP status codes and messages
❌ Error Responses: Full error text when API calls fail
�� Response Data: Complete JSON response structure
Data Processing Logging:
�� Video/Reel Counts: Shows how many items found vs processed
🔍 Individual Item Processing: Details for each video/reel being processed
✅ Success/Failure Tracking: Shows which items were successfully extracted
Response Handling:
Shows exactly how we parse the API responses
Tracks data extraction success/failure
Logs the final processed video data structure
Now when you try to add a creator, you'll see detailed logs showing:
The exact API endpoints being called
The complete response data structure
How we parse and extract video information
Any errors or issues in the process
This will help us understand exactly what's happening with the API calls and why we're getting rate limit errors or missing data.