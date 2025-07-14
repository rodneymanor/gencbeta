## Updated API Endpoints - Modern Authentication

All endpoints now use the modern ApiKeyAuthService with user-specific API keys.

### 1. List Collections

**Endpoint**: GET /api/collections
**Authentication**: User-specific API key
**Returns**: Collections owned by the authenticated user

### 2. Create Collection

**Endpoint**: POST /api/collections
**Authentication**: User-specific API key
**Body**: { "title": "Collection Name", "description": "Optional description" }

### 3. Add Video to Collection

**Endpoint**: POST /api/add-video-to-collection  
**Authentication**: User-specific API key
**Body**: { "videoUrl": "https://...", "collectionId": "abc123", "title": "Optional title" }
**Security**: Verifies user owns the collection

### 4. Get Collection Videos

**Endpoint**: GET /api/add-video-to-collection?collectionId=abc123
**Authentication**: User-specific API key
**Security**: Verifies user owns the collection

### 5. Alternative List Collections (Legacy)

**Endpoint**: GET /api/list-collections
**Authentication**: User-specific API key
**Returns**: Same as /api/collections but different format

## Authentication

All endpoints require a user-specific API key in one of these formats:

- Header: x-api-key: gencbeta*A*[your_key]
- Header: Authorization: Bearer gencbeta*A*[your_key]

## Rate Limiting

- 50 requests per minute per API key
- 2 violations allowed before temporary blocking
