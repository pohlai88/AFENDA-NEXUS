'use client';

import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { cn } from '@/lib/utils';
import type { AccountListItem, AccountType } from '../queries/account.queries';

const typeColors: Record<AccountType, string> = {
  ASSET: 'bg-info/10 text-info border-info/20',
  LIABILITY: 'bg-warning/10 text-warning border-warning/20',
  EQUITY: 'bg-success/10 text-success border-success/20',
  REVENUE: 'bg-success/10 text-success border-success/20',
  EXPENSE: 'bg-destructive/10 text-destructive border-destructive/20',
};

const columns: ColumnDef<AccountListItem>[] = [
  {
    id: 'code',
    header: 'Code',
    className: 'w-[100px]',
    sortable: true,
    sortFn: (a, b) => a.code.localeCompare(b.code),
    accessorFn: (row) => <span className="font-mono text-xs">{row.code}</span>,
  },
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    sortFn: (a, b) => a.name.localeCompare(b.name),
    accessorFn: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'type',
    header: 'Type',
    className: 'w-[120px]',
    sortable: true,
    sortFn: (a, b) => a.type.localeCompare(b.type),
    accessorFn: (row) => (
      <span
        className={cn(
          'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
          typeColors[row.type] ?? 'bg-muted text-muted-foreground border-border'
        )}
      >
        {row.type}
      </span>
    ),
  },
  {
    id: 'normalBalance',
    header: 'Normal',
    className: 'w-[100px]',
    sortable: true,
    sortFn: (a, b) => a.normalBalance.localeCompare(b.normalBalance),
    accessorFn: (row) => <span className="text-xs text-muted-foreground">{row.normalBalance}</span>,
  },
  {
    id: 'isActive',
    header: 'Active',
    className: 'w-[80px] text-center',
    sortable: true,
    sortFn: (a, b) => Number(b.isActive) - Number(a.isActive),
    accessorFn: (row) => (
      <div className="text-center">
        {row.isActive ? (
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
        ) : (
          <span className="inline-block h-2 w-2 rounded-full bg-muted" />
        )}
      </div>
    ),
  },
];

interface AccountTableProps {
  data: AccountListItem[];
}

export function AccountTable({ data }: AccountTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyFn={(row) => row.id}
      searchPlaceholder="Search accounts..."
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return row.code.toLowerCase().includes(q) || row.name.toLowerCase().includes(q);
      }}
      emptyMessage="No accounts match your search."
    />
  );
}
