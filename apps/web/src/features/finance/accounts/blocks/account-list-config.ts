import type { StatusOption } from '@/components/erp/list-filter-bar';

export const ACCOUNT_TYPES: StatusOption[] = [
  { value: undefined, label: 'All' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];
