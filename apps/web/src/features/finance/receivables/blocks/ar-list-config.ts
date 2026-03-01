import type { StatusOption } from '@/components/erp/list-filter-bar';

export const AR_STATUSES: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
  { value: 'WRITTEN_OFF', label: 'Written Off' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
