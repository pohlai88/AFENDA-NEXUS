import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/* ─── Shared ERP Loading Skeletons ────────────────────────────────────────── */
/* Keep loading.tsx files DRY — import a variant instead of inlining.          */
/* ────────────────────────────────────────────────────────────────────────── */

const SKELETON_VARIANTS = [
  'table',
  'detail',
  'form',
  'report',
  'statement',
  'dashboard',
  'cards',
  'settings',
  'tabbed-table',
  'approval',
  'split-pane',
] as const;

type SkeletonVariant = (typeof SKELETON_VARIANTS)[number];

// ─── Primitive Helpers ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  );
}

function SkeletonTableGrid({
  rows,
  cols,
  cellWidth = 'w-24',
}: {
  rows: number;
  cols: number;
  cellWidth?: string;
}) {
  return (
    <div className="rounded-md border">
      <div className="border-b p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`h-${i}`} className={cn('h-4', cellWidth)} />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`r-${i}`} className="flex gap-4 border-b p-4 last:border-b-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={`c-${i}-${j}`} className={cn('h-4', cellWidth)} />
          ))}
        </div>
      ))}
    </div>
  );
}

// --------------- table ---------------

export function TableSkeleton({
  rows = 8,
  cols = 6,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading table"
    >
      {/* header + action */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      {/* filter bar */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <SkeletonTableGrid rows={rows} cols={cols} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- detail ---------------

export function DetailSkeleton({
  tabs = 2,
  rows = 5,
  cols = 6,
  className,
}: {
  tabs?: number;
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading details"
    >
      {/* summary card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`s-${i}`} className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
      {/* tab buttons */}
      <div className="flex gap-2">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={`t-${i}`} className="h-9 w-20" />
        ))}
      </div>
      {/* line-items table */}
      <SkeletonTableGrid rows={rows} cols={cols} cellWidth="w-20" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- form ---------------

export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading form"
    >
      {/* breadcrumb + heading */}
      <div className="space-y-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* form body */}
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <Skeleton key={`f-${i}`} className="h-16 w-full" />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- report (KPI cards + table) ---------------

export function ReportSkeleton({
  cards = 4,
  rows = 8,
  cols = 6,
  className,
}: {
  cards?: number;
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading report"
    >
      <Skeleton className="h-8 w-48" />
      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={`k-${i}`} />
        ))}
      </div>
      <SkeletonTableGrid rows={rows} cols={cols} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- financial statement (sections) ---------------

export function StatementSkeleton({
  sections = 3,
  rowsPerSection = 6,
  className,
}: {
  sections?: number;
  rowsPerSection?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading statement"
    >
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: sections }).map((_, s) => (
        <div key={`s-${s}`} className="rounded-md border">
          <div className="border-b p-4">
            <Skeleton className="h-4 w-32" />
          </div>
          {Array.from({ length: rowsPerSection }).map((_, i) => (
            <div key={`r-${s}-${i}`} className="flex gap-4 border-b p-4 last:border-b-0">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- dashboard (KPI cards + charts) ---------------

export function DashboardSkeleton({
  cards = 4,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* page heading */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={`k-${i}`} />
        ))}
      </div>
      {/* chart / activity area */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`a-${i}`} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- cards-only (module landing pages) ---------------

export function CardsSkeleton({
  cards = 4,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={`k-${i}`} />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- settings / preferences ---------------

export function SettingsSkeleton({
  sections = 3,
  fieldsPerSection = 3,
  className,
}: {
  sections?: number;
  fieldsPerSection?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading settings"
    >
      {/* page heading */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      {/* settings sections */}
      <div className="mx-auto max-w-3xl space-y-8">
        {Array.from({ length: sections }).map((_, s) => (
          <div key={`sec-${s}`} className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-1 h-3 w-64" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: fieldsPerSection }).map((_, f) => (
                <div key={`f-${s}-${f}`} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* save button */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- tabbed-table (module hub: stats + tabs + table) ---------------

export function TabbedTableSkeleton({
  cards = 4,
  tabs = 4,
  rows = 8,
  cols = 6,
  className,
}: {
  cards?: number;
  tabs?: number;
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading module"
    >
      {/* heading + action */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={`k-${i}`} />
        ))}
      </div>
      {/* tab bar */}
      <div className="flex gap-2">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={`tab-${i}`} className="h-9 w-24" />
        ))}
      </div>
      {/* data table */}
      <SkeletonTableGrid rows={rows} cols={cols} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- approval inbox ---------------

export function ApprovalSkeleton({
  statusCards = 6,
  filterTabs = 4,
  rows = 8,
  cols = 6,
  className,
}: {
  statusCards?: number;
  filterTabs?: number;
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading approvals"
    >
      {/* heading */}
      <Skeleton className="h-8 w-48" />
      {/* status count cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: statusCards }).map((_, i) => (
          <SkeletonCard key={`s-${i}`} />
        ))}
      </div>
      {/* filter tabs */}
      <div className="flex gap-2">
        {Array.from({ length: filterTabs }).map((_, i) => (
          <Skeleton key={`ft-${i}`} className="h-9 w-24" />
        ))}
      </div>
      {/* workflow queue table */}
      <SkeletonTableGrid rows={rows} cols={cols} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- split-pane (reconciliation / matching workspace) ---------------

export function SplitPaneSkeleton({
  rows = 6,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      {/* back button + heading */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="mt-1 h-4 w-96" />
        </div>
      </div>
      {/* main grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* workspace — two side-by-side tables */}
        <div className="space-y-4">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <Skeleton className="mb-3 h-5 w-32" />
              <SkeletonTableGrid rows={rows} cols={cols} cellWidth="w-20" />
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <Skeleton className="mb-3 h-5 w-32" />
              <SkeletonTableGrid rows={rows} cols={cols} cellWidth="w-20" />
            </div>
          </div>
        </div>
        {/* sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="mb-3 h-5 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// --------------- unified entry point ---------------

/**
 * Generic page loading skeleton.
 *
 * Use the `variant` prop to match the page layout:
 * - `table`        — list / data-table page
 * - `detail`       — document detail with summary card + line items
 * - `form`         — create / edit form
 * - `report`       — KPI summary cards + data table
 * - `statement`    — financial statement with sections (balance sheet, P&L)
 * - `dashboard`    — KPI cards + chart / activity feed
 * - `cards`        — simple KPI cards only (module landing pages)
 * - `settings`     — settings / preferences with sectioned toggle groups
 * - `tabbed-table` — module hub: summary cards + tab navigation + data table
 * - `approval`     — approval inbox: status cards + filter tabs + queue table
 * - `split-pane`   — two-column matching workspace + sidebar (reconciliation)
 */
export type { SkeletonVariant as LoadingSkeletonVariant };

export function LoadingSkeleton({
  variant = 'detail',
  className,
}: {
  variant?: SkeletonVariant;
  className?: string;
}) {
  switch (variant) {
    case 'table':
      return <TableSkeleton className={className} />;
    case 'form':
      return <FormSkeleton className={className} />;
    case 'report':
      return <ReportSkeleton className={className} />;
    case 'statement':
      return <StatementSkeleton className={className} />;
    case 'dashboard':
      return <DashboardSkeleton className={className} />;
    case 'cards':
      return <CardsSkeleton className={className} />;
    case 'settings':
      return <SettingsSkeleton className={className} />;
    case 'tabbed-table':
      return <TabbedTableSkeleton className={className} />;
    case 'approval':
      return <ApprovalSkeleton className={className} />;
    case 'split-pane':
      return <SplitPaneSkeleton className={className} />;
    default:
      return <DetailSkeleton className={className} />;
  }
}
