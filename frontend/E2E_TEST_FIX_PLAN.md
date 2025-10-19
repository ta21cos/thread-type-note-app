# E2E Test Fix Plan

## Current Status

- **Passing:** 25/34 tests (74%)
- **Failing:** 9 tests
  - 3 search tests (fail in parallel, pass individually)
  - 6 delete tests (dropdown menu interaction issues)

## Issues Identified

### 1. Dropdown Menu Not Working in Tests (Delete Tests Failing)

**Problem:**
- Menu button has `opacity-0` class and only shows on hover (`group-hover:opacity-100`)
- Playwright tests struggle with hover interactions
- The dropdown menu is hard to discover for users

**Location:** `ThreadView.tsx:125`
```typescript
<div className="absolute top-0 right-0 opacity-0 transition-opacity group-hover:opacity-100">
```

**Current Test Approach:**
```typescript
// Complex approach needed
const threadNode = page.locator('[data-testid="thread-node"]').first();
await threadNode.hover();
const menuButton = threadNode.locator('button').first();
await menuButton.waitFor({ state: 'visible', timeout: 5000 });
await menuButton.click();
// ... then wait for portal-rendered menu items
```

### 2. Search Tests Failing in Parallel

**Problem:**
- Tests share the same test database
- Running in parallel (6 workers) causes tests to see each other's notes
- Example: Test expects 1 note but sees 37 notes from other tests

**Evidence:**
```
Error: expect(received).toHaveCount(expected)
Expected: 1
Received: 2  // or 37 when running full suite
```

**Current Config:** `playwright.config.ts:11`
```typescript
workers: process.env.CI ? 1 : undefined,  // undefined = auto (6 workers)
```

### 3. "should handle no search results" Works Manually

**User reported:** This test passes in manual testing but fails in parallel runs due to test isolation issues (other tests' notes appearing in results).

## Proposed Solutions

### Solution A: Fix Dropdown Menu Visibility (Recommended)

**Option A1: Make Menu Button Always Visible (Best UX)**

**Change in `ThreadView.tsx`:**
```diff
- <div className="absolute top-0 right-0 opacity-0 transition-opacity group-hover:opacity-100">
+ <div className="absolute top-0 right-0 opacity-50 transition-opacity group-hover:opacity-100">
```

**Benefits:**
- ✅ Better UX - users can discover actions without hovering
- ✅ More accessible
- ✅ Tests become much simpler (no hover complexity)
- ✅ Matches Slack/Discord pattern (visible but subtle)

**Test becomes:**
```typescript
// Simple approach
await page.click('[data-testid="thread-node-menu-button"]');
await page.click('[data-testid="thread-action-delete"]');
```

**Option A2: Add data-testid to Menu Button (Minimal Change)**

**Change in `ThreadView.tsx`:**
```diff
- <Button size="icon" variant="ghost" className="h-7 w-7">
+ <Button size="icon" variant="ghost" className="h-7 w-7" data-testid="thread-node-menu-button">
```

**Test becomes:**
```typescript
// Force click the hidden button
await page.click('[data-testid="thread-node-menu-button"]', { force: true });
await page.click('[data-testid="thread-action-delete"]');
```

**Benefits:**
- ✅ Keeps current design aesthetic
- ✅ Simpler test code
- ⚠️ Uses force click (not ideal but works)

### Solution B: Fix Test Isolation for Search Tests

**Option B1: Run Search Tests Sequentially**

**Change in `05-search-notes.spec.ts`:**
```diff
- test.describe('Search Notes', () => {
+ test.describe.serial('Search Notes', () => {
```

**Benefits:**
- ✅ Simple one-line change
- ✅ Ensures tests run one at a time
- ✅ No database conflicts
- ⚠️ Tests take longer (sequential vs parallel)

**Option B2: Reduce Worker Count**

**Change in `playwright.config.ts`:**
```diff
- workers: process.env.CI ? 1 : undefined,
+ workers: process.env.CI ? 1 : 3,
```

**Benefits:**
- ✅ Reduces parallel test conflicts
- ✅ Still faster than fully sequential
- ⚠️ Doesn't guarantee isolation

**Option B3: Improve Test Database Isolation**

Create separate test database per worker:
```typescript
// In playwright.config.ts
use: {
  testIdAttribute: 'data-testid',
},
globalSetup: require.resolve('./tests/e2e/setup/global-setup'),
```

**Benefits:**
- ✅ True test isolation
- ✅ Parallel tests work
- ⚠️ More complex setup

## Recommended Approach

### **Combine Solutions A1 + B1**

1. **Make dropdown menu button visible** (`opacity-50`) - improves UX and simplifies tests
2. **Run search tests sequentially** with `test.describe.serial`

**Files to modify:**
1. `ThreadView.tsx` - Change opacity (2 locations: root note menu + reply note menus)
2. `05-search-notes.spec.ts` - Add `.serial` to test.describe
3. `test-helpers.ts` - Add data-testid to menu button reference in deleteNote()

**Expected outcome:**
- ✅ All 34 tests pass
- ✅ Better UX for end users
- ✅ Simpler test code
- ✅ More maintainable

## Alternative: Minimal Changes Approach

If you want to keep the current design exactly as-is:

1. Keep `opacity-0` on menu button
2. Add data-testid to menu button
3. Run all delete tests and search tests sequentially:

```typescript
// 05-search-notes.spec.ts
test.describe.serial('Search Notes', () => {

// 06-delete-note.spec.ts
test.describe.serial('Delete Note', () => {
```

**Expected outcome:**
- ✅ All tests pass
- ✅ No design changes
- ⚠️ Tests take longer
- ⚠️ Complex test code with force clicks

## Questions to Consider

1. **UX Priority:** Do you prefer the hidden menu (cleaner) or visible menu (more discoverable)?
2. **Test Speed:** Is slower sequential execution acceptable for reliability?
3. **Design Aesthetics:** Should we match Slack's always-visible menu pattern?

## Next Steps

Please choose your preferred approach:
- **A**: Recommended (visible menu + sequential search tests)
- **B**: Minimal (keep hidden menu + sequential all failing tests)
- **C**: Custom combination

Once confirmed, I will implement the changes and verify all tests pass.
