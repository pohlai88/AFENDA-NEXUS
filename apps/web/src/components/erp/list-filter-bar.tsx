'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StatusOption {
  /** URL param value — `undefined` means "show all" (no status filter). */
  value: string | undefined;
  label: string;
}

export interface ListFilterBarProps {
  /** Base URL for the list page. Pass a routes.* constant. */
  baseUrl: string;
  /** Status pill options. First entry should be the "All" option with `value: undefined`. */
  statuses?: StatusOption[];
  /** Currently active status from searchParams. */
  currentStatus?: string;
  /** URL param key used for the status pills. Defaults to `'status'`. */
  filterKey?: string;
  /** Enable a search input that maps to the `q` search param. */
  searchable?: boolean;
  /** Current search query value. */
  currentSearch?: string;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Enable date range inputs (from/to). */
  dateRange?: boolean;
  /** Current "from" date value (ISO string). */
  currentFromDate?: string;
  /** Current "to" date value (ISO string). */
  currentToDate?: string;
  /** Additional searchParams to preserve when navigating (e.g. `{ supplierId: '...' }`). */
  preserveParams?: Record<string, string | undefined>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildUrl(
  baseUrl: string,
  overrides: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(overrides)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ListFilterBar({
  baseUrl,
  statuses,
  currentStatus,
  filterKey = 'status',
  searchable = false,
  currentSearch,
  searchPlaceholder = 'Search…',
  dateRange = false,
  currentFromDate,
  currentToDate,
  preserveParams = {},
}: ListFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /** Build preserved params object excluding filter keys we control. */
  function getBaseParams(statusOverride?: string | undefined) {
    const base: Record<string, string | undefined> = { ...preserveParams };
    if (statusOverride !== undefined) {
      base[filterKey] = statusOverride || undefined;
    } else {
      base[filterKey] = currentStatus;
    }
    if (currentSearch) base.q = currentSearch;
    if (currentFromDate) base.from = currentFromDate;
    if (currentToDate) base.to = currentToDate;
    return base;
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get('q') as string)?.trim() || undefined;
    const from = (formData.get('from') as string) || undefined;
    const to = (formData.get('to') as string) || undefined;

    const params: Record<string, string | undefined> = {
      ...preserveParams,
      [filterKey]: currentStatus,
      q,
      from,
      to,
    };

    startTransition(() => {
      router.push(buildUrl(baseUrl, params));
    });
  }

  function handleClearSearch() {
    const params: Record<string, string | undefined> = {
      ...preserveParams,
      [filterKey]: currentStatus,
      from: currentFromDate,
      to: currentToDate,
    };
    startTransition(() => {
      router.push(buildUrl(baseUrl, params));
    });
  }

  const hasControls = searchable || dateRange;

  return (
    <div className="space-y-3">
      {/* Status pills row */}
      {statuses && statuses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {statuses.map((s) => {
            const isActive = s.value === currentStatus || (!s.value && !currentStatus);
            const linkParams = getBaseParams(s.value ?? '');
            // Reset to page 1 on status change
            delete linkParams.page;
            return (
              <Link
                key={s.label}
                href={buildUrl(baseUrl, linkParams)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Search + date range bar */}
      {hasControls && (
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3"
        >
          {searchable && (
            <div className="relative flex-1 min-w-[200px]">
              <Label htmlFor="list-search" className="sr-only">
                Search
              </Label>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="list-search"
                name="q"
                type="search"
                placeholder={searchPlaceholder}
                defaultValue={currentSearch ?? ''}
                className="pl-9"
              />
              {currentSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {dateRange && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="list-from" className="text-xs">
                  From
                </Label>
                <Input
                  id="list-from"
                  name="from"
                  type="date"
                  defaultValue={currentFromDate ?? ''}
                  className="w-[150px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="list-to" className="text-xs">
                  To
                </Label>
                <Input
                  id="list-to"
                  name="to"
                  type="date"
                  defaultValue={currentToDate ?? ''}
                  className="w-[150px]"
                />
              </div>
            </>
          )}

          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Loading…' : 'Apply'}
          </Button>
        </form>
      )}
    </div>
  );
}
