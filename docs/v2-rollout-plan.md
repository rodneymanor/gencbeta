# V2 Script Generation - Idiot-Proof Rollout Plan

## Current Status ✅

- Pre-processors implemented (Input Validator, Context Enricher, Rule Engine)
- V2 API endpoint exists and is backward compatible
- Test page exists for side-by-side comparison
- **SAFE TO TEST**: V2 currently uses the same generation logic as V1 with preprocessing

## Rollout Strategy

### Phase 1: Test Current Implementation (NOW - Safe)

1. **What to test**: Preprocessing pipeline validation
2. **Risk**: ZERO - V2 uses same generation as V1
3. **How to test**:
   ```
   - Go to /dashboard/test/script-generation
   - Enable "Include debug information"
   - Run tests to see preprocessing steps
   - Verify both V1 and V2 produce same results
   ```

### Phase 2: Minimal Content Generators (1-2 days)

Instead of building new generators from scratch, wrap existing logic:

```typescript
// generators/hook-generator.ts
export class HookGenerator {
  static async generate(enrichedInput, rules) {
    // Use existing ScriptGenerationService logic
    // Just extract the hook portion
    return existingService.generateHook(input);
  }
}
```

**Benefits**:

- No risk of breaking existing functionality
- Gradual migration
- Can test each component individually

### Phase 3: Incremental Improvements (1 week)

1. **Add template-based hooks** for speed scripts
2. **Implement formula-based structure** for educational
3. **Keep AI generation** for viral content

### Phase 4: Feature Flag Rollout (Safe)

```typescript
// In V2 route
const useNewGenerators = await getFeatureFlag(userId, "v2_generators");
if (useNewGenerators) {
  // Use new modular generators
} else {
  // Use adapter with existing logic
}
```

### Phase 5: Gradual User Migration

1. **5% of users** → Monitor for 24 hours
2. **25% of users** → Monitor for 48 hours
3. **50% of users** → Monitor for 1 week
4. **100% rollout**

## Why This Approach Works

1. **No Breaking Changes**: Each phase is backward compatible
2. **Visible Progress**: Test page shows improvements at each step
3. **Easy Rollback**: Feature flags allow instant rollback
4. **Incremental Value**: Each phase delivers improvements

## Next Immediate Steps

1. **Fix TypeScript errors** in current code
2. **Test preprocessing pipeline** with debug info
3. **Create wrapper generators** using existing logic
4. **Add feature flag system**

## Testing Checklist

- [ ] V2 produces same output as V1
- [ ] Preprocessing steps are visible in debug mode
- [ ] Validation catches invalid inputs
- [ ] Context enrichment adds proper guidelines
- [ ] Rules engine selects appropriate strategies
- [ ] Performance is similar or better than V1

## Emergency Rollback

If anything goes wrong:

1. Set feature flag to 0%
2. All traffic goes to V1
3. Debug V2 issues without affecting users
