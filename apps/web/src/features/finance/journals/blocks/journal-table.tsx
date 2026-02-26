'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { routes } from '@/lib/constants';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { JournalListItem } from '../queries/journal.queries';

const columns: ColumnDef<JournalListItem>[] = [
  {
    id: 'documentNumber',
    header: 'Document',
    sortable: true,
    sortFn: (a, b) => a.documentNumber.localeCompare(b.documentNumber),
    accessorFn: (row) => (
      <Link
        href={routes.finance.journalDetail(row.id)}
        className="font-mono text-sm font-medium text-primary hover:underline"
      >
        {row.documentNumber}
      </Link>
    ),
  },
  {
    id: 'description',
    header: 'Description',
    sortable: true,
    sortFn: (a, b) => a.description.localeCompare(b.description),
    accessorFn: (row) => <span className="text-muted-foreground">{row.description}</span>,
  },
  {
    id: 'postingDate',
    header: 'Date',
    sortable: true,
    sortFn: (a, b) => a.postingDate.localeCompare(b.postingDate),
    accessorFn: (row) => <DateCell date={row.postingDate} format="short" />,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    sortFn: (a, b) => a.status.localeCompare(b.status),
    accessorFn: (row) => <StatusBadge status={row.status} />,
  },
  {
    id: 'totalDebit',
    header: 'Debit',
    className: 'text-right',
    sortable: true,
    sortFn: (a, b) => Number(a.totalDebit) - Number(b.totalDebit),
    accessorFn: (row) => <MoneyCell amount={row.totalDebit} currency={row.currency} />,
  },
  {
    id: 'totalCredit',
    header: 'Credit',
    className: 'text-right',
    sortable: true,
    sortFn: (a, b) => Number(a.totalCredit) - Number(b.totalCredit),
    accessorFn: (row) => <MoneyCell amount={row.totalCredit} currency={row.currency} />,
  },
];

interface JournalTableProps {
  data: JournalListItem[];
  total: number;
}

export function JournalTable({ data, total }: JournalTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No journals found"
        description="Create your first journal entry to get started."
        icon={FileText}
        action={
          <Button asChild>
            <Link href={routes.finance.journalNew}>Create Journal</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        keyFn={(row) => row.id}
        searchPlaceholder="Search journals..."
        searchFn={(row, query) => {
          const q = query.toLowerCase();
          return (
            row.documentNumber.toLowerCase().includes(q) ||
            row.description.toLowerCase().includes(q)
          );
        }}
        emptyMessage="No journals match your search."
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {total} journal{total !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}
