import type { StatusOption } from '@/components/erp/list-filter-bar';

export const AP_STATUSES: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'INCOMPLETE', label: 'Incomplete (Triage)' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
