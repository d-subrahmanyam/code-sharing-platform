# Why The Initial Approach Failed

## The Problem With Our First Attempt

We initially tried to fix the issue by modifying the snippet fetch condition:

```typescript
// FIRST ATTEMPT (WRONG):
// Changed from: if (!isNew && resolvedSnippetId && !tinyCode)
// To: if (!isNew && resolvedSnippetId)
```

**Why this didn't work**:
- We were treating the symptom, not the disease
- Even though we removed the `!tinyCode` check, `isNew` was still TRUE for joinee sessions
- Because `isNew = true`, the fetch was STILL skipped (due to `!isNew` condition)
- The root cause (`resolvedSnippetId = 'new'`) remained unfixed

## The Root Cause We Missed

We were looking at the wrong place initially:

❌ **WRONG DIAGNOSIS**: "The fetch effect skips when `tinyCode` is present"

✅ **CORRECT DIAGNOSIS**: "The `resolvedSnippetId` is set to 'new' instead of actual ID, which makes `isNew = true`, which skips the fetch"

### The Real Issue

**In `useEffect` for tinyCode resolution** (lines 179-190):
```typescript
if (tinyCode.includes('new-snippet')) {
  setResolvedSnippetId('new')  // ← THIS IS THE ROOT CAUSE
  // Never calls lookupOwnerByTinyCode()
  return
}
```

This meant:
1. `resolvedSnippetId = 'new'` ← Root cause starts here
2. `isNew = true` ← Cascades to derived state
3. Fetch is skipped → Data never loads

## Why We Missed It

### Console Logs Confusion

The console logs were showing:
```
[EditorPage] 🔍 Owner Detection Status:
   Is New Snippet: true  ← We saw this
   → IS OWNER: ✗ NO
```

We were focused on the OWNER DETECTION issue when the real issue was the `isNew` flag being incorrect in the first place!

### Trap: Treating Symptoms

The initial thinking was:
- "Title is not loading in joinee" → Problem with Redux fetch
- "Let's remove the `!tinyCode` check" → That should fix it
- But this didn't work because `isNew` was still preventing the fetch

We needed to ask: "WHY is `isNew = true`?" 
- Answer: Because `resolvedSnippetId = 'new'`
- Then: "WHERE is it being set to 'new'?"
- Answer: In the tinyCode resolution effect
- Then: "WHY is it set to 'new' instead of actual ID?"
- Answer: The special case handling for "new-snippet-XXXX" doesn't look up the actual ID

## The Correct Analysis Method

Looking back, here's what we should have done systematically:

### Step 1: Trace the Data Flow
```
formData.title = '' (empty)
  ↑
Where does formData get set?
  → useEffect that checks snippet from Redux
  ↑
Where does snippet come from?
  → Redux selector: state.snippet?.items.find(...)
  ↑
Where does Redux snippet data come from?
  → SNIPPET_FETCH_REQUEST dispatch
  ↑
Where is this dispatch called?
  → useEffect checking: if (!isNew && resolvedSnippetId)
  ↑
Is this effect running?
  → NO, because isNew = true
  ↑
Why is isNew = true?
  → Because resolvedSnippetId = 'new'
  ↑
Why is resolvedSnippetId = 'new'?
  → THE ACTUAL BUG LOCATION
```

### Step 2: Check Why `resolvedSnippetId = 'new'`

Found it in tinyCode resolution:
```typescript
if (tinyCode.includes('new-snippet')) {
  setResolvedSnippetId('new')  // ← HERE'S THE BUG
}
```

### Step 3: Fix at the Source

Don't patch downstream effects, fix the root cause:
```typescript
// Remove special case, let ALL tiny codes go through proper resolution
const ownerDetails = await lookupOwnerByTinyCode(tinyCode)
setResolvedSnippetId(ownerDetails.snippetId)  // ← Actual ID from database
```

## Key Takeaway

**Root cause analysis requires systematic backward tracing**:

1. **What's broken?** Empty title in UI
2. **Where should it come from?** Redux state
3. **Why isn't Redux updated?** Fetch effect not running
4. **Why isn't fetch effect running?** `isNew` condition blocking it
5. **Why is `isNew = true`?** `resolvedSnippetId = 'new'`
6. **Why is it set to 'new'?** Hardcoded in special case
7. **Why that special case?** Incorrect logic about "new-snippet-XXXX" being "new"
8. **REAL BUG FOUND**: "new-snippet-XXXX" should resolve to actual IDs, not stay as 'new'

---

## Lesson Learned

Don't modify conditions downstream when the root cause is in how values are set upstream.

**Wrong approach**: Patch the effects that use the wrong values
**Right approach**: Fix the code that sets the wrong values in the first place

In this case:
- ❌ We initially tried: Patch the fetch effect condition
- ✅ We should have: Fixed the tinyCode resolution to get actual IDs

This is why deep investigation of console logs and state values is critical before making fixes.
