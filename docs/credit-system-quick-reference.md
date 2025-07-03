# Credit System Quick Reference

## 🚀 Quick Integration Checklist

### Frontend Integration (2 steps)

1. **Import the hook**
   ```typescript
   import { useUsage } from "@/contexts/usage-context";
   const { triggerUsageUpdate } = useUsage();
   ```

2. **Trigger after success**
   ```typescript
   if (response.ok && data.success) {
     triggerUsageUpdate(); // ✅ This is all you need!
     // Handle success...
   }
   ```

### Backend Integration (3 steps)

1. **Check credits before operation**
   ```typescript
   const creditCheck = await CreditsService.canPerformAction(userId, "operation_type", accountLevel);
   if (!creditCheck.canPerform) {
     return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
   }
   ```

2. **Perform your operation**
   ```typescript
   const result = await yourOperationLogic(requestData);
   ```

3. **Deduct credits after success**
   ```typescript
   await CreditsService.trackUsageAndDeductCredits(userId, "operation_type", accountLevel, {
     service: "gemini",
     tokensUsed: result.tokensUsed || 0,
     responseTime: Date.now() - startTime,
     success: true,
     timestamp: new Date().toISOString(),
   });
   ```

## 📋 Operation Types & Costs

Add your operation to `src/types/usage-tracking.ts`:

```typescript
export type CreditOperation = 
  | "script_generation"    // 1 credit
  | "voice_creation"       // 5 credits  
  | "video_processing"     // 2 credits
  | "chat_refinement"      // 1 credit
  | "your_new_operation";  // Define your cost

export const CREDIT_COSTS: Record<CreditOperation, number> = {
  // ... existing costs
  your_new_operation: 3, // ← Add your cost here
};
```

## 🎯 Copy-Paste Templates

### Frontend Component Template
```typescript
import { useUsage } from "@/contexts/usage-context";

export function YourFeatureComponent() {
  const { triggerUsageUpdate } = useUsage();

  const handleAction = async () => {
    try {
      const response = await fetch("/api/your-feature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        triggerUsageUpdate(); // ✅ Real-time credit update
        // Handle success
      }
    } catch (error) {
      // Handle error
    }
  };
}
```

### API Route Template
```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { CreditsService } from "@/lib/credits-service";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Authenticate
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const userId = user.uid;
    const accountLevel = user.role === "super_admin" ? "pro" : "free";
    
    // 2. Check credits
    const creditCheck = await CreditsService.canPerformAction(userId, "your_operation", accountLevel);
    if (!creditCheck.canPerform) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // 3. Your logic here
    const result = await yourFeatureLogic(await request.json());
    
    // 4. Deduct credits
    await CreditsService.trackUsageAndDeductCredits(userId, "your_operation", accountLevel, {
      service: "gemini",
      tokensUsed: result.tokensUsed || 0,
      responseTime: Date.now() - startTime,
      success: true,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Credits not updating in UI | Ensure `triggerUsageUpdate()` is called after `response.ok && data.success` |
| Credits deducted on error | Only call `trackUsageAndDeductCredits` after successful operation |
| Multiple deductions | Don't call `triggerUsageUpdate()` multiple times - it's debounced |

## 🔍 Debug Logs

Add these to track credit flow:

```typescript
// Frontend
console.log("💳 [YourFeature] Triggering usage stats update");

// Backend  
console.log(`💳 [YourFeature] Checking credits for user ${userId}`);
console.log(`💳 [YourFeature] Credits available: ${creditCheck.canPerform}`);
console.log(`💳 [YourFeature] Deducting credits for operation`);
```

## ⚡ That's It!

The system handles:
- ✅ Real-time UI updates (no polling!)
- ✅ Debounced refresh (1-second delay)
- ✅ Error handling
- ✅ Authentication validation
- ✅ Credit validation

Just follow the 2 frontend steps + 3 backend steps and you're done! 