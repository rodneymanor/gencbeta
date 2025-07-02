# Firebase SDK Usage Patterns

## Critical Rule: Client vs Admin SDK Context

### The Problem We Solved
**Issue**: Usage tracking was failing with "Permission Denied" errors because we were using the client-side Firebase SDK (`@/lib/firebase`) in API routes, which run on the server without user authentication context.

**Error**: `7 PERMISSION_DENIED: Missing or insufficient permissions`

### The Solution
**Rule**: Always use the appropriate Firebase SDK based on execution context:

- **Client-Side Components**: Use client SDK (`@/lib/firebase`)
- **API Routes**: Use admin SDK (`@/lib/firebase-admin`)

## SDK Usage Matrix

| Context | SDK to Use | Import From | Authentication |
|---------|------------|-------------|----------------|
| React Components | Client SDK | `@/lib/firebase` | User auth tokens |
| Custom Hooks | Client SDK | `@/lib/firebase` | User auth tokens |
| API Routes | Admin SDK | `@/lib/firebase-admin` | Service account |
| Server Actions | Admin SDK | `@/lib/firebase-admin` | Service account |
| Middleware | Admin SDK | `@/lib/firebase-admin` | Service account |

## Usage Tracking Implementation

### ❌ Wrong Pattern (Causes Permission Errors)
```typescript
// In API route - DON'T DO THIS
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Client SDK in API route!

export async function POST(request: Request) {
  // This will fail with permission errors
  await addDoc(collection(db, "usage_tracking"), data);
}
```

### ✅ Correct Pattern
```typescript
// In API route - DO THIS
import { adminDb } from "@/lib/firebase-admin"; // Admin SDK

export async function POST(request: Request) {
  // This works correctly
  await adminDb.collection("usage_tracking").add(data);
}
```

## File Organization Pattern

For services that need both client and server usage:

```
src/lib/
├── usage-tracker.ts        # Client-side version (React components)
└── usage-tracker-admin.ts  # Server-side version (API routes)
```

### Client Version (`usage-tracker.ts`)
- Uses `firebase/firestore` client SDK
- For React components and hooks
- Requires user authentication
- Subject to Firestore security rules

### Admin Version (`usage-tracker-admin.ts`)
- Uses Firebase Admin SDK
- For API routes and server functions
- Uses service account authentication
- Bypasses Firestore security rules

## Firestore Security Rules

When tracking usage, ensure proper rules exist:

```javascript
// firestore.rules
match /usage_tracking/{usageId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
}
```

## Business Context: Why Usage Tracking Matters

Usage tracking is critical for our business model:

1. **Customer Billing**: Track AI API usage (Gemini, OpenAI) to calculate costs per customer
2. **Rate Limiting**: Prevent abuse and manage API quotas
3. **Analytics**: Understand feature usage patterns
4. **Cost Attribution**: Allocate infrastructure costs to specific users/features
5. **Pricing Strategy**: Data-driven decisions on pricing tiers

### Tracked Metrics
- AI tokens consumed per request
- Response times for performance monitoring
- Success/failure rates for reliability metrics
- Feature usage for product decisions

## Implementation Checklist

When adding new features that consume AI APIs:

- [ ] Implement usage tracking in API routes using admin SDK
- [ ] Add proper error handling (tracking failures shouldn't break main flow)
- [ ] Include relevant metadata (user ID, feature, tokens used)
- [ ] Test with both successful and failed AI requests
- [ ] Verify Firestore rules allow the tracking operations
- [ ] Document any new usage patterns or metrics

## Common Pitfalls to Avoid

1. **Using client SDK in API routes** → Permission errors
2. **Missing Firestore rules for new collections** → Permission errors
3. **Throwing errors on tracking failures** → Breaking main functionality
4. **Not tracking failed requests** → Incomplete usage data
5. **Missing user context in tracking** → Can't attribute costs

## Testing Usage Tracking

```typescript
// Test that tracking doesn't break main flow
try {
  const result = await mainApiFunction();
  await trackUsage(userId, result);
  return result;
} catch (mainError) {
  // Still track the failure
  await trackUsage(userId, { success: false, error: mainError.message });
  throw mainError;
}
```

## Key Takeaway

**Always match your Firebase SDK to your execution context.** This prevents permission errors and ensures proper authentication flow. When in doubt, check where your code runs:

- Browser/Client → Client SDK
- Server/API → Admin SDK 