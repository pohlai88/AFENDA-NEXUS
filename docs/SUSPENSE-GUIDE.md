# Suspense Best Practices for Next.js App Router

## Executive Summary

Based on React official documentation and Next.js App Router architecture, this
guide provides the correct approach to implementing Suspense boundaries in
server components.

## Key Principles from React Official Docs

### What Suspense Does

- Suspense displays a fallback while its children are loading
- Only works with **Suspense-enabled data sources**:
  - Next.js Server Components
  - `lazy()` for code splitting
  - `use()` hook with promises
  - Suspense-enabled frameworks (Relay, Next.js)

### Critical Limitations

❌ **Suspense DOES NOT detect**:

- Data fetched inside `useEffect`
- Data fetched in event handlers
- Top-level `await` calls in Server Components that have already completed

✅ **Suspense DOES work with**:

- Async Server Components as children
- Async operations that haven't resolved yet
- Streaming Server Rendering in Next.js

## Common Mistakes in Our Codebase

### ❌ WRONG: Wrapping After Await

```tsx
// apps/web/src/app/(supplier-portal)/portal/compliance/page.tsx
export default async function PortalCompliancePage() {
  // ❌ These awaits block the entire component
  const ctx = await getRequestContext();
  const supplierResult = await getPortalSupplier(ctx);
  const result = await getPortalCompliance(ctx, supplier.supplierId);

  return (
    // ❌ This Suspense does nothing - awaits already completed
    <Suspense fallback={<LoadingSkeleton />}>
      <div>{/* Content already loaded */}</div>
    </Suspense>
  );
}
```

**Why this doesn't work:**

- All `await` calls execute sequentially at the top level
- By the time React reaches `<Suspense>`, all data is already loaded
- The fallback will never show
- Server Component sends complete HTML, defeating streaming benefits

## ✅ CORRECT Patterns

### Pattern 1: Split Into Async Child Components

```tsx
// page.tsx
export default async function PortalCompliancePage() {
  // Only await critical data needed for the page structure
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" />

      {/* Suspense wraps async child component */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ComplianceData ctx={ctx} />
      </Suspense>
    </div>
  );
}

// Separate async component
async function ComplianceData({ ctx }: { ctx: RequestContext }) {
  // These awaits happen inside Suspense boundary
  const supplierResult = await getPortalSupplier(ctx);
  const complianceResult = await getPortalCompliance(
    ctx,
    supplierResult.value.supplierId
  );

  return (
    <>
      <PortalComplianceNav activeTab="summary" />
      <PortalComplianceSummaryBlock data={complianceResult.value} />
    </>
  );
}
```

### Pattern 2: Nested Suspense for Granular Streaming

```tsx
export default async function PortalCompliancePage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" />

      {/* Fast: show navigation immediately */}
      <PortalComplianceNav activeTab="summary" />

      {/* Slow: stream in later */}
      <Suspense fallback={<SummarySkeleton />}>
        <ComplianceSummary ctx={ctx} />
      </Suspense>

      {/* Even slower: separate boundary */}
      <Suspense fallback={<DocumentsSkeleton />}>
        <ComplianceDocuments ctx={ctx} />
      </Suspense>
    </div>
  );
}
```

### Pattern 3: Parallel Loading with Promise.all

```tsx
async function DashboardData({ ctx }: { ctx: RequestContext }) {
  // Load in parallel, not sequential
  const [supplier, dashboard, notifications] = await Promise.all([
    getPortalSupplier(ctx),
    getPortalDashboard(ctx),
    getNotifications(ctx),
  ]);

  return <DashboardContent data={{ supplier, dashboard, notifications }} />;
}
```

## Next.js Specific Considerations

### Loading.tsx Files

Next.js automatically wraps route segments in Suspense when you provide
`loading.tsx`:

```
app/
  (supplier-portal)/
    portal/
      compliance/
        page.tsx       # Server Component
        loading.tsx    # Auto-wrapped in <Suspense>
```

Equivalent to:

```tsx
<Suspense fallback={<LoadingComponent />}>
  <Page />
</Suspense>
```

### When to Use Manual Suspense

Use manual `<Suspense>` when:

1. You need **multiple loading states** on the same page
2. You want **progressive enhancement** (some content shows immediately)
3. You're implementing **infinite scroll** or pagination
4. You have **optional/non-critical data** that can load later

Don't use manual `<Suspense>` when:

1. All data loads at once at the page level → Use `loading.tsx`
2. You await everything at the top level → Refactor into child components first
3. For client components → Use `useEffect` + loading state instead

## Design Guidelines

### Suspense Placement Strategy

From React docs:

> Don't put a Suspense boundary around every component. Suspense boundaries
> should not be more granular than the loading sequence that you want the user
> to experience.

**Work with your designer** to determine:

- What loading states should show when
- Which content reveals together vs. progressively
- Where skeleton screens make sense

### Example: Progressive Reveal

```tsx
export default async function ArtistPage({ id }: { id: string }) {
  return (
    <>
      <h1>Artist Profile</h1>

      {/* Fast: Biography loads first */}
      <Suspense fallback={<BioSkeleton />}>
        <Biography artistId={id} />
      </Suspense>

      {/* Slower: Albums load next */}
      <Suspense fallback={<AlbumsSkeleton />}>
        <Albums artistId={id} />
      </Suspense>

      {/* Slowest: Comments load last */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments artistId={id} />
      </Suspense>
    </>
  );
}
```

## Migration Strategy for Our Codebase

### Step 1: Identify Misused Suspense

Run: `grep -r "<Suspense" apps/web/src/app --include="*.tsx"`

Look for patterns where:

- Page does `await` then returns `<Suspense>`
- Suspense wraps static content
- Every child component has its own Suspense

### Step 2: Refactor Pattern

**Before:**

```tsx
export default async function Page() {
  const data = await getData(); // ❌ Blocks everything
  return (
    <Suspense>
      <Content data={data} />
    </Suspense>
  );
}
```

**After:**

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DataLoader />
    </Suspense>
  );
}

async function DataLoader() {
  const data = await getData(); // ✅ Suspends inside boundary
  return <Content data={data} />;
}
```

### Step 3: Test Streaming

Verify streaming works:

```tsx
// Add artificial delay to test
async function SlowComponent() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const data = await getData();
  return <div>{data}</div>;
}
```

You should see:

1. Page shell renders immediately
2. Fallback shows for 2 seconds
3. Content streams in and replaces fallback

## Troubleshooting

### Issue: Suspense fallback never shows

**Diagnosis:**

```tsx
// Check if awaits are BEFORE Suspense
export default async function Page() {
  const data = await getData(); // ← This is the problem
  return <Suspense>...</Suspense>;
}
```

**Fix:** Move await inside Suspense boundary via child component

### Issue: W22 gate warning about missing Suspense

The gate check `tools/scripts/web-drift-check.mjs` W22 detects:

- `page.tsx` with multiple `await` calls
- No `<Suspense>` wrapping async operations
- No "use client" directive

**To fix:**

1. If truly streaming → Split into async child components + Suspense
2. If not streaming → Accept the warning or refactor architecture
3. If client component → Add "use client" directive

## Implementation Checklist

For each page with async data:

- [ ] Does the page `await` data before rendering?
  - → If yes, refactor into child async components

- [ ] Does the page have multiple data sources?
  - → If yes, consider nested Suspense for progressive loading

- [ ] Is there a `loading.tsx` file?
  - → If yes, manual Suspense may be redundant

- [ ] Can some content show immediately?
  - → If yes, use Suspense only for slow parts

- [ ] Will users benefit from seeing partial content?
  - → If yes, implement nested Suspense boundaries

## References

- [React Suspense Official Docs](https://react.dev/reference/react/Suspense)
- [Next.js Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Server Components](https://react.dev/learn/render-and-commit)

## Related Files

- `.agents/skills/react-patterns/SKILL.md` - React patterns guide
- `tools/scripts/web-drift-check.mjs` - W22 Suspense discipline check
- `apps/web/ARCHITECTURE.afenda-web.md` - Frontend architecture
