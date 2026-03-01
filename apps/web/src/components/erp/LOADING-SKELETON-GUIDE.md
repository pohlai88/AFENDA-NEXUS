# Loading Skeleton Guide

Centralized loading UI for Next.js `loading.tsx` and Suspense fallbacks.

## Next.js Best Practices

| Practice | Why |
|----------|-----|
| **Place `loading.tsx` next to `page.tsx`** | Next.js wraps the page in Suspense; `loading.tsx` is the automatic fallback for that segment. |
| **Mirror the page layout** | Skeleton structure should match the loaded content to avoid layout shift (CLS). |
| **Import from `@/components/erp/loading-skeleton`** | Keep skeletons DRY; don't inline skeleton markup. |
| **Compose for complex pages** | Use multiple exports (e.g. `CardsSkeleton` + `TableSkeleton`) when the page has distinct sections. |

## Quick Start

### Simple page (single variant)

```tsx
// app/(shell)/(erp)/finance/payables/loading.tsx
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export default function PayablesLoading() {
  return <LoadingSkeleton variant="table" />;
}
```

### Composed page (header + cards + table)

```tsx
// app/(shell)/(erp)/finance/approvals/loading.tsx
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton, TableSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApprovalsLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Approvals">
      <PageHeader>
        <PageHeaderHeading>Approval Inbox</PageHeaderHeading>
        <PageHeaderDescription>Review and approve pending documents.</PageHeaderDescription>
      </PageHeader>
      <CardsSkeleton cards={6} />
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        <TableSkeleton />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
```

## Variant Reference

| Variant | Use for |
|---------|---------|
| `table` | List / data-table pages |
| `detail` | Document detail (summary card + line items) |
| `form` | Create / edit forms |
| `report` | KPI cards + data table |
| `statement` | Financial statements (balance sheet, P&L) |
| `dashboard` | KPI cards + chart / activity feed |
| `cards` | Module landing (KPI cards only) |
| `settings` | Settings / preferences (sectioned toggles) |
| `tabbed-table` | Module hub: cards + tabs + table |
| `approval` | Approval inbox: status cards + filter tabs + queue |
| `split-pane` | Two-column workspace + sidebar (reconciliation) |

## Exported Components

- **`LoadingSkeleton`** — Unified entry; pass `variant` and optional `className`.
- **`KpiDeckSkeleton`** — Bento KPI deck (domain dashboards); `count`, `className`
- **`ChartsSkeleton`** — Chart + diagram grid (domain dashboards); `className`
- **`TableSkeleton`** — `rows`, `cols`, `className`
- **`DetailSkeleton`** — `tabs`, `rows`, `cols`, `className`
- **`FormSkeleton`** — `fields`, `className`
- **`ReportSkeleton`** — `cards`, `rows`, `cols`, `className`
- **`StatementSkeleton`** — `sections`, `rowsPerSection`, `className`
- **`DashboardSkeleton`** — `cards`, `className`
- **`CardsSkeleton`** — `cards`, `className`
- **`SettingsSkeleton`** — `sections`, `fieldsPerSection`, `className`
- **`TabbedTableSkeleton`** — `cards`, `tabs`, `rows`, `cols`, `className`
- **`ApprovalSkeleton`** — `statusCards`, `filterTabs`, `rows`, `cols`, `className`
- **`SplitPaneSkeleton`** — `rows`, `cols`, `className`

## Accessibility

All skeletons include:

- `role="status"`
- `aria-live="polite"`
- `aria-busy="true"`
- `aria-label` (descriptive)
- `<span className="sr-only">Loading…</span>`

When composing, wrap in a container with `role="status"` and `aria-label`, and add the sr-only span.
