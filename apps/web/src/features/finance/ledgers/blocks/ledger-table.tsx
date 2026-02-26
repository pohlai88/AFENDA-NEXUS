'use client';

import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import type { LedgerListItem } from '../queries/ledger.queries';

const columns: ColumnDef<LedgerListItem>[] = [
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    sortFn: (a, b) => a.name.localeCompare(b.name),
    accessorFn: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'companyName',
    header: 'Company',
    sortable: true,
    sortFn: (a, b) => (a.companyName ?? a.companyId).localeCompare(b.companyName ?? b.companyId),
    accessorFn: (row) => row.companyName ?? row.companyId,
  },
  {
    id: 'baseCurrency',
    header: 'Base Currency',
    sortable: true,
    sortFn: (a, b) => a.baseCurrency.localeCompare(b.baseCurrency),
    accessorFn: (row) => <Badge variant="outline">{row.baseCurrency}</Badge>,
  },
];

interface LedgerTableProps {
  data: LedgerListItem[];
}

export function LedgerTable({ data }: LedgerTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyFn={(row) => row.id}
      searchPlaceholder="Search ledgers..."
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return (
          row.name.toLowerCase().includes(q) ||
          (row.companyName ?? '').toLowerCase().includes(q) ||
          row.baseCurrency.toLowerCase().includes(q)
        );
      }}
      emptyMessage="No ledgers match your search."
    />
  );
}
