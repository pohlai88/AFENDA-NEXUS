'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SavedViewsPicker } from './saved-views-picker';

interface ReportSavedViewsProps {
  /** Unique key for saved views storage (e.g. 'balance-sheet', 'ap-aging') */
  moduleKey: string;
}

/**
 * Composable saved views control for report pages.
 * Reads current searchParams as filters and navigates when a saved view is applied.
 *
 * Add alongside <ReportFilterBar> in report pages:
 * ```tsx
 * <div className="flex flex-wrap items-center gap-4">
 *   <ReportFilterBar variant="..." ... />
 *   <ReportSavedViews moduleKey="balance-sheet" />
 * </div>
 * ```
 */
export function ReportSavedViews({ moduleKey }: ReportSavedViewsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build current filters from searchParams
  const currentFilters: Record<string, string | null> = {};
  searchParams.forEach((value, key) => {
    currentFilters[key] = value;
  });

  const handleApply = (filters: Record<string, string | number | boolean | null>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value != null && value !== '') {
        params.set(key, String(value));
      }
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <SavedViewsPicker
      moduleKey={moduleKey}
      currentFilters={currentFilters}
      onApply={handleApply}
    />
  );
}
