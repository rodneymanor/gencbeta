# API Key Authentication System Documentation

## Overview

The Gen C Beta API Key Authentication System provides secure, rate-limited access to collection and video management endpoints for Chrome extension integration. This system implements production-grade security with Firebase authentication, role-based access control (RBAC), and sophisticated rate limiting.

## System Architecture

### Core Components

1. **API Key Generation** (`/api/keys`)

   - Secure key generation using Node.js crypto module
   - Single active key policy per user
   - Stripe-style single-display key management

2. **Authentication Middleware** (`src/middleware.ts`)

   - Request interception and validation
   - Rate limiting with violation tracking
   - User context injection

3. **RBAC Integration** (`src/lib/collections-rbac.ts`)

   - Permission-based collection access
   - Role-specific functionality (creator, coach, super_admin)
   - Ownership verification

4. **Rate Limiting** (`src/lib/api-key-auth.ts`)
   - 50 requests per minute per API key
   - Escalating lockout system (2 violations = 1-hour lockout)
   - Automatic violation reset

### Security Features

- **256-bit Entropy**: API keys generated using 32 random bytes
- **Hash Storage**: Only SHA-256 hashes stored in database
- **Single Key Policy**: One active key per user
- **Automatic Expiration**: Keys can be revoked instantly
- **Rate Limiting**: Prevents abuse with escalating penalties

## API Key Management

### Generate API Key

**Endpoint:** `POST /api/keys`

**Headers:**

```
Authorization: Bearer <firebase-id-token>
```

**Response:**

```json
{
  "success": true,
  "apiKey": "gencbeta_Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1Uv3Wx5Yz7",
  "message": "API key generated successfully",
  "warning": "This key will only be shown once. Please store it securely.",
  "user": {
    "id": "user-firebase-uid",
    "email": "user@example.com",
    "role": "creator"
  },
  "metadata": {
    "keyId": "a1b2c3d4",
    "createdAt": "2024-01-15T10:30:00Z",
    "rateLimit": "50 requests per minute",
    "violations": "2 violations = 1 hour lockout"
  }
}
```

### Get API Key Status

**Endpoint:** `GET /api/keys`

**Headers:**

```
Authorization: Bearer <firebase-id-token>
```

**Response:**

```json
{
  "success": true,
  "user": {
    "email": "user@example.com"
  },
  "hasActiveKey": true,
  "activeKey": {
    "keyId": "a1b2c3d4",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastUsed": "2024-01-15T14:22:00Z",
    "requestCount": 127,
    "violations": 0
  },
  "keyHistory": [...],
  "limits": {
    "requestsPerMinute": 50,
    "violationLockoutHours": 1,
    "maxViolationsBeforeLockout": 2
  }
}
```

### Revoke API Key

**Endpoint:** `DELETE /api/keys`

**Headers:**

```
Authorization: Bearer <firebase-id-token>
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully revoked 1 API key(s)",
  "user": {
    "email": "user@example.com"
  },
  "revokedAt": "2024-01-15T15:45:00Z"
}
```

## Protected Endpoints

### Collections API

**Endpoint:** `GET /api/collections`

**Headers:**

```
x-api-key: gencbeta_your-api-key-here
```

**Response:**

```json
{
  "success": true,
  "collections": [
    {
      "id": "collection-1",
      "title": "TikTok Dance Videos",
      "userId": "user-firebase-uid",
      "videoCount": 15,
      "isShared": false,
      "createdAt": "2024-01-10T09:00:00Z"
    }
  ],
  "total": 1,
  "user": {
    "id": "user-firebase-uid",
    "email": "user@example.com"
  },
  "timestamp": "2024-01-15T16:00:00Z"
}
```

### Add Video to Collection

**Endpoint:** `POST /api/add-video-to-collection`

**Headers:**

```
x-api-key: gencbeta_your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "videoUrl": "https://www.tiktok.com/@user/video/1234567890",
  "collectionId": "collection-id-here",
  "title": "Optional custom title"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Video processing has started successfully",
  "requestId": "req_abc123",
  "status": "processing",
  "estimatedTime": "30-60 seconds",
  "collectionId": "collection-id-here",
  "videoUrl": "https://www.tiktok.com/@user/video/1234567890",
  "title": "Optional custom title",
  "user": {
    "id": "user-firebase-uid",
    "email": "user@example.com",
    "role": "creator"
  },
  "timestamp": "2024-01-15T16:05:00Z",
  "validationTime": "45ms"
}
```

## Chrome Extension Integration

### Setup

1. **Store API Key Securely:**

```javascript
// In your Chrome extension background script
const API_KEY = "gencbeta_your-api-key-here";
const BASE_URL = "https://your-domain.vercel.app";
```

2. **Add Permissions to manifest.json:**

```json
{
  "permissions": ["storage", "activeTab", "https://your-domain.vercel.app/*"]
}
```

### Usage Examples

#### Get User Collections

```javascript
async function getCollections() {
  try {
    const response = await fetch(`${BASE_URL}/api/collections`, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.collections;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    throw error;
  }
}
```

#### Add Video to Collection

```javascript
async function addVideoToCollection(videoUrl, collectionId, title = null) {
  try {
    const response = await fetch(`${BASE_URL}/api/add-video-to-collection`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl,
        collectionId,
        title,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to add video:", error);
    throw error;
  }
}
```

#### Handle Rate Limiting

```javascript
async function makeApiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "x-api-key": API_KEY,
        ...options.headers,
      },
    });

    if (response.status === 429) {
      const errorData = await response.json();
      const resetTime = errorData.rateLimitInfo?.resetTime;

      if (resetTime) {
        const waitTime = new Date(resetTime) - new Date();
        console.log(`Rate limited. Waiting ${waitTime}ms before retry.`);

        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return makeApiCall(url, options);
      }
    }

    return response;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}
```

## Role-Based Access Control

### Permission Matrix

| Role            | Own Collections | Shared Collections (Read) | Shared Collections (Write) | Admin Collections |
| --------------- | --------------- | ------------------------- | -------------------------- | ----------------- |
| **Creator**     | ✅ Full Access  | ✅ View Only              | ❌ No Access               | ❌ No Access      |
| **Coach**       | ✅ Full Access  | ✅ View Only              | ✅ Own Shared Only         | ❌ No Access      |
| **Super Admin** | ✅ Full Access  | ✅ View All               | ✅ Write All               | ✅ Full Access    |

### Access Rules

1. **Collection Ownership**: Users can only add videos to collections they own
2. **Shared Collections**: Creators can view shared collections but cannot modify them
3. **Coach Permissions**: Coaches can create shared collections for their creators
4. **Super Admin**: Full access to all collections and administrative functions

## Rate Limiting

### Limits

- **Standard Rate**: 50 requests per minute per API key
- **Violation Threshold**: 2 violations trigger a lockout
- **Lockout Duration**: 1 hour after 2 violations
- **Reset Window**: 1 minute sliding window

### Violation Scenarios

1. **Exceeding Rate Limit**: More than 50 requests in 1 minute
2. **Burst Patterns**: Rapid successive requests that exceed capacity
3. **Sustained Overuse**: Consistent pattern of limit violations

### Rate Limit Response

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "rateLimitInfo": {
    "resetTime": "2024-01-15T16:31:00Z",
    "violationsCount": 1,
    "requestsPerMinute": 50,
    "maxViolations": 2
  }
}
```

## Error Handling

### Common Error Responses

#### Authentication Errors

```json
{
  "error": "Unauthorized",
  "message": "API key required. Provide via x-api-key header."
}
```

#### Permission Errors

```json
{
  "error": "Forbidden",
  "message": "You can only add videos to collections you own"
}
```

#### Rate Limiting Errors

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Account locked for 1 hour.",
  "rateLimitInfo": {
    "resetTime": "2024-01-15T17:30:00Z",
    "violationsCount": 2,
    "lockoutUntil": "2024-01-15T17:30:00Z"
  }
}
```

### Best Practices

1. **Store API Keys Securely**: Never expose keys in client-side code
2. **Handle Rate Limits**: Implement exponential backoff for retries
3. **Validate Responses**: Always check response status and handle errors
4. **Log Appropriately**: Log errors but not sensitive data
5. **Monitor Usage**: Track API key usage and performance

## Testing

### Test Script

Run the included test script to validate your API key system:

```bash
# Set your Firebase ID token
export FIREBASE_ID_TOKEN="your-firebase-id-token-here"

# Run tests
node scripts/test-api-keys.js
```

### Test Coverage

1. ✅ API Key Generation
2. ✅ Key Status Retrieval
3. ✅ Collections API Access
4. ✅ Add Video API Access
5. ✅ Rate Limiting Behavior

## Troubleshooting

### Common Issues

#### "Invalid Firebase token"

- Ensure the Firebase ID token is current (they expire every hour)
- Verify the token is from the correct Firebase project

#### "Collection not found or access denied"

- Check that the collection ID exists
- Verify the user owns the collection or has appropriate permissions

#### "Rate limit exceeded"

- Wait for the rate limit window to reset
- Implement proper rate limiting in your extension

#### "API key already exists"

- Each user can only have one active API key
- Revoke the existing key before generating a new one

### Support

For technical support or questions about the API key system:

1. Check the console logs for detailed error messages
2. Review the rate limiting information in error responses
3. Verify RBAC permissions for the user and collection
4. Test with the provided test script to isolate issues

## Security Considerations

### Best Practices

1. **Never log API keys** in production environments
2. **Rotate keys periodically** for enhanced security
3. **Monitor unusual usage patterns** that might indicate compromise
4. **Implement client-side rate limiting** to prevent accidental violations
5. **Use HTTPS only** for all API communications

### Incident Response

If an API key is compromised:

1. **Revoke immediately** using the DELETE `/api/keys` endpoint
2. **Generate a new key** and update your Chrome extension
3. **Monitor account activity** for any unauthorized access
4. **Report the incident** if sensitive data was accessed

---

This documentation provides a complete guide to implementing and using the Gen C Beta API Key Authentication System. The system is production-ready and designed to scale with your Chrome extension's needs while maintaining robust security and user access controls.
