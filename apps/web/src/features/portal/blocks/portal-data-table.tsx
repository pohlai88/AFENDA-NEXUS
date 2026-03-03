'use client';

/**
 * PortalDataTable — CAP-SEARCH P16
 *
 * A portal-branded data table wrapper that adds:
 * - URL-synced filter chips (active filters shown as dismissible badges)
 * - Standardised empty state and loading skeleton
 * - Composable slot for a DataTable beneath the filter bar
 *
 * Usage:
 * ```tsx
 * <PortalDataTable
 *   filters={[
 *     { key: 'status', label: 'Status', value: searchParams.status },
 *     { key: 'from', label: 'From', value: searchParams.from },
 *   ]}
 *   baseUrl="/portal/invoices"
 *   searchParams={searchParams}
 *   total={data.total}
 * >
 *   <DataTable columns={cols} data={data.items} pagination={...} />
 * </PortalDataTable>
 * ```
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterChip {
  /** URL search-param key (e.g. 'status', 'from', 'category') */
  key: string;
  /** Human-readable label (e.g. 'Status') */
  label: string;
  /** Current value — if undefined/null/empty the chip is not shown */
  value?: string | null;
  /** Display-friendly value; if omitted, raw `value` is shown */
  displayValue?: string;
}

interface PortalDataTableProps {
  /** Active filters to display as chips above the table */
  filters?: FilterChip[];
  /** Base pathname for URL construction (defaults to current pathname) */
  baseUrl?: string;
  /** Current search params object (used when building cleared-filter URLs) */
  searchParams?: Record<string, string | undefined>;
  /** Total record count for display in the header */
  total?: number;
  /** Heading shown alongside the filter bar */
  title?: string;
  /** Optional toolbar slot (buttons rendered to the right of filter chips) */
  toolbar?: React.ReactNode;
  /** Table content — typically a DataTable */
  children: React.ReactNode;
  className?: string;
}

// ─── Hook: URL filter manipulation ───────────────────────────────────────────

function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const clearFilter = useCallback(
    (key: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete(key);
      next.delete('page'); // reset pagination when filters change
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(
    (keys: string[]) => {
      const next = new URLSearchParams(searchParams.toString());
      keys.forEach((k) => next.delete(k));
      next.delete('page');
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname, searchParams]
  );

  return { clearFilter, clearAll, isPending };
}

// ─── Active filter chips ──────────────────────────────────────────────────────

function FilterChipBar({
  filters,
  onClear,
  onClearAll,
  isPending,
}: {
  filters: FilterChip[];
  onClear: (key: string) => void;
  onClearAll: () => void;
  isPending: boolean;
}) {
  const activeFilters = filters.filter(
    (f) => f.value !== undefined && f.value !== null && f.value !== ''
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters:
      </span>

      {activeFilters.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className={cn(
            'gap-1.5 pl-2.5 pr-1.5 py-0.5 text-xs font-medium',
            isPending && 'opacity-60'
          )}
        >
          <span className="text-muted-foreground">{chip.label}:</span>{' '}
          {chip.displayValue ?? chip.value}
          <button
            type="button"
            onClick={() => onClear(chip.key)}
            disabled={isPending}
            className="ml-0.5 rounded-sm opacity-70 ring-offset-background hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none"
            aria-label={`Clear ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearAll}
          disabled={isPending}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PortalDataTable({
  filters = [],
  total,
  title,
  toolbar,
  children,
  className,
}: PortalDataTableProps) {
  const { clearFilter, clearAll, isPending } = useFilterParams();
  const activeFilters = filters.filter(
    (f) => f.value !== undefined && f.value !== null && f.value !== ''
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header row: title + record count + toolbar */}
      {(title || total !== undefined || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {total !== undefined && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {total.toLocaleString()}
              </span>
            )}
          </div>
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <FilterChipBar
          filters={filters}
          onClear={clearFilter}
          onClearAll={() => clearAll(activeFilters.map((f) => f.key))}
          isPending={isPending}
        />
      )}

      {/* Table content */}
      <div className={cn(isPending && 'opacity-70 transition-opacity duration-150')}>
        {children}
      </div>
    </div>
  );
}

// ─── Filter Form Hook (for building filter UIs) ──────────────────────────────

/**
 * Hook for building filter forms that push params to the URL.
 *
 * ```tsx
 * const { setFilter } = usePortalFilters();
 * <Select onValueChange={(v) => setFilter('status', v)} />
 * ```
 */
export function usePortalFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === '' || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      next.delete('page');
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname, searchParams]
  );

  const setFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      next.delete('page');
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname, searchParams]
  );

  return { setFilter, setFilters, isPending };
}
