import type { StatusOption } from '@/components/erp/list-filter-bar';

export const ACTIVE_OPTIONS: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];
