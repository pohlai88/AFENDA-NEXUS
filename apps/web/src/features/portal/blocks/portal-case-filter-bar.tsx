/**
 * SP-7012 (CAP-SEARCH): Portal Case Filter Bar
 *
 * Wraps <ListFilterBar> with case-specific status options and a category
 * dropdown. Preserves all active params when navigating.
 */
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { ListFilterBar, type StatusOption } from '@/components/erp/list-filter-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildListHref } from '@/lib/build-list-href';
import { routes } from '@/lib/constants';
import { Label } from '@/components/ui/label';

const CASE_STATUSES: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'AWAITING_INFO', label: 'Awaiting Info' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REOPENED', label: 'Reopened' },
];

const CASE_CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'QUALITY', label: 'Quality' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'GENERAL', label: 'General' },
  { value: 'ESCALATION', label: 'Escalation' },
];

interface PortalCaseFilterBarProps {
  currentStatus?: string;
  currentCategory?: string;
  currentSearch?: string;
}

export function PortalCaseFilterBar({
  currentStatus,
  currentCategory,
  currentSearch,
}: PortalCaseFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = useCallback(
    (value: string) => {
      const href = buildListHref(
        routes.portal.cases,
        {
          status: currentStatus,
          q: currentSearch,
          category: value || undefined,
        },
        1
      );
      startTransition(() => router.push(href));
    },
    [currentStatus, currentSearch, router]
  );

  return (
    <div className="space-y-3">
      <ListFilterBar
        baseUrl={routes.portal.cases}
        statuses={CASE_STATUSES}
        currentStatus={currentStatus}
        searchable
        currentSearch={currentSearch}
        searchPlaceholder="Search by ticket number or subject…"
        preserveParams={{ category: currentCategory }}
      />
      <div className="flex items-center gap-2">
        <Label
          htmlFor="case-category-filter"
          className="text-sm text-muted-foreground whitespace-nowrap"
        >
          Category:
        </Label>
        <Select
          value={currentCategory ?? ''}
          onValueChange={handleCategoryChange}
          disabled={isPending}
        >
          <SelectTrigger id="case-category-filter" className="h-8 w-48 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {CASE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
