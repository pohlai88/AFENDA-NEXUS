import type { StatusOption } from '@/components/erp/list-filter-bar';

export const JOURNAL_STATUSES: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'REVERSED', label: 'Reversed' },
  { value: 'VOIDED', label: 'Voided' },
];
