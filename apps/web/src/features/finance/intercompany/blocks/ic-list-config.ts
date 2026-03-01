import type { StatusOption } from '@/components/erp/list-filter-bar';

export const IC_STATUSES: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAIRED', label: 'Paired' },
  { value: 'RECONCILED', label: 'Reconciled' },
];
