# API Authentication Guide

## Overview

This guide explains how to handle authentication in API routes and when to require or skip authentication.

## Authentication Methods

### 1. API Key Authentication
- **File**: `src/lib/api-key-auth.ts`
- **Function**: `authenticateApiKey(request)`
- **Usage**: For authenticated API endpoints that require user identification

### 2. Firebase Authentication
- **File**: `src/lib/firebase-auth-helpers.ts`
- **Usage**: For user session-based authentication

## When to Require Authentication

### ✅ **Require Authentication For:**
- User-specific data (user profiles, settings, preferences)
- Protected resources (private collections, personal videos)
- Administrative functions (user management, system settings)
- Billing and subscription features
- Rate-limited operations

### ❌ **Skip Authentication For:**
- Public data (public creator profiles, public videos)
- Demo/development features
- Public API endpoints
- Landing page content
- Public search functionality

## Implementation Patterns

### Pattern 1: Require Authentication
```typescript
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateApiKey(request);

    // Check if authResult is a NextResponse (error)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // User is authenticated, proceed with protected operation
    const { user } = authResult;
    console.log(`🔍 [API] Authenticated user: ${user.email}`);

    // Your API logic here...
  } catch (error) {
    // Error handling
  }
}
```

### Pattern 2: Optional Authentication
```typescript
export async function GET(request: NextRequest) {
  try {
    // Try to authenticate, but don't require it
    const authResult = await authenticateApiKey(request);
    const user = authResult instanceof NextResponse ? null : authResult?.user;

    if (user) {
      console.log(`🔍 [API] Authenticated user: ${user.email}`);
      // Return personalized data
    } else {
      console.log(`🔍 [API] Unauthenticated access`);
      // Return public data
    }

    // Your API logic here...
  } catch (error) {
    // Error handling
  }
}
```

### Pattern 3: No Authentication Required
```typescript
export async function GET(request: NextRequest) {
  try {
    // For public endpoints, no authentication needed
    console.log("🔍 [API] Public endpoint - no authentication required");

    // Your API logic here...
  } catch (error) {
    // Error handling
  }
}
```

## Error Responses

### 401 Unauthorized
```typescript
return NextResponse.json(
  {
    success: false,
    error: "Authentication required"
  },
  { status: 401 }
);
```

### 403 Forbidden
```typescript
return NextResponse.json(
  {
    success: false,
    error: "Insufficient permissions"
  },
  { status: 403 }
);
```

### 429 Too Many Requests
```typescript
return NextResponse.json(
  {
    success: false,
    error: "Rate limit exceeded",
    resetTime: rateLimitResult.resetTime
  },
  { status: 429 }
);
```

## Best Practices

### 1. **Clear Documentation**
- Document which endpoints require authentication
- Explain what data is public vs. private
- Provide examples of authentication headers

### 2. **Consistent Error Messages**
- Use consistent error response format
- Include helpful error messages
- Provide guidance on how to fix authentication issues

### 3. **Graceful Degradation**
- Allow public access to basic features
- Provide enhanced features for authenticated users
- Don't break functionality for unauthenticated users

### 4. **Security Considerations**
- Never expose sensitive data in public endpoints
- Validate all inputs regardless of authentication
- Use HTTPS in production
- Implement proper rate limiting

## Current Implementation Status

### Public Endpoints (No Auth Required)
- `GET /api/creators` - List public creators
- `POST /api/creators` - Add creator to spotlight (public feature)
- `GET /api/process-creator` - Process creator videos (public feature)

### Protected Endpoints (Auth Required)
- User management endpoints
- Billing and subscription endpoints
- Administrative functions

### TODO: Implement Authentication For
- User-specific collections
- Personal video management
- User preferences and settings
- Advanced analytics (when implemented)

## Testing Authentication

### Test Unauthenticated Access
```bash
curl -X POST http://localhost:3000/api/creators \
  -H "Content-Type: application/json" \
  -d '{"username":"test","platform":"tiktok"}'
```

### Test Authenticated Access
```bash
curl -X POST http://localhost:3000/api/protected-endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"data":"test"}'
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized on Public Endpoints**
   - Check if authentication is being required unnecessarily
   - Verify the endpoint is intended to be public

2. **Missing API Key**
   - Ensure the frontend is sending the API key in headers
   - Check if the user is logged in and has an API key

3. **Rate Limiting**
   - Check if the user has exceeded rate limits
   - Verify the rate limiting configuration

4. **Firebase Admin Not Initialized**
   - Ensure Firebase Admin SDK is properly configured
   - Check environment variables

### Debug Steps

1. Check server logs for authentication details
2. Verify API key format and validity
3. Test with different authentication methods
4. Check rate limiting status
5. Verify user permissions and roles 