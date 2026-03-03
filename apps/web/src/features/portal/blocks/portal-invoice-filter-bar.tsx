/**
 * SP-7012 (CAP-SEARCH): Portal Invoice Filter Bar
 *
 * Wraps the shared <ListFilterBar> with portal-specific invoice status options.
 * Preserves pagination when switching status pills.
 */
'use client';

import { ListFilterBar, type StatusOption } from '@/components/erp/list-filter-bar';
import { routes } from '@/lib/constants';

const INVOICE_STATUSES: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface PortalInvoiceFilterBarProps {
  currentStatus?: string;
  currentSearch?: string;
  currentFromDate?: string;
  currentToDate?: string;
}

export function PortalInvoiceFilterBar({
  currentStatus,
  currentSearch,
  currentFromDate,
  currentToDate,
}: PortalInvoiceFilterBarProps) {
  return (
    <ListFilterBar
      baseUrl={routes.portal.invoices}
      statuses={INVOICE_STATUSES}
      currentStatus={currentStatus}
      searchable
      currentSearch={currentSearch}
      searchPlaceholder="Search by invoice number or reference…"
      dateRange
      currentFromDate={currentFromDate}
      currentToDate={currentToDate}
    />
  );
}
