'use client';

import Link from 'next/link';
import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { routes } from '@/lib/constants';
import type { IcTransactionListItem } from '../queries/ic.queries';

const columns: ColumnDef<IcTransactionListItem>[] = [
  {
    id: 'description',
    header: 'Description',
    sortable: true,
    sortFn: (a, b) => a.description.localeCompare(b.description),
    accessorFn: (row) => (
      <Link
        href={routes.finance.icTransactionDetail(row.id)}
        className="font-medium hover:underline"
      >
        {row.description}
      </Link>
    ),
  },
  {
    id: 'sourceCompanyName',
    header: 'Source',
    className: 'w-[140px]',
    sortable: true,
    sortFn: (a, b) => a.sourceCompanyName.localeCompare(b.sourceCompanyName),
    accessorFn: (row) => <span className="text-xs">{row.sourceCompanyName}</span>,
  },
  {
    id: 'mirrorCompanyName',
    header: 'Mirror',
    className: 'w-[140px]',
    sortable: true,
    sortFn: (a, b) => a.mirrorCompanyName.localeCompare(b.mirrorCompanyName),
    accessorFn: (row) => <span className="text-xs">{row.mirrorCompanyName}</span>,
  },
  {
    id: 'amount',
    header: 'Amount',
    className: 'w-[120px] text-right',
    sortable: true,
    sortFn: (a, b) => Number(a.amount) - Number(b.amount),
    accessorFn: (row) => <MoneyCell amount={row.amount} currency={row.currency} />,
  },
  {
    id: 'transactionDate',
    header: 'Date',
    className: 'w-[100px]',
    sortable: true,
    sortFn: (a, b) => a.transactionDate.localeCompare(b.transactionDate),
    accessorFn: (row) => <DateCell date={row.transactionDate} format="short" />,
  },
  {
    id: 'settlementStatus',
    header: 'Status',
    className: 'w-[100px]',
    sortable: true,
    sortFn: (a, b) => a.settlementStatus.localeCompare(b.settlementStatus),
    accessorFn: (row) => <StatusBadge status={row.settlementStatus} />,
  },
];

interface IcTransactionTableProps {
  data: IcTransactionListItem[];
}

export function IcTransactionTable({ data }: IcTransactionTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyFn={(row) => row.id}
      searchPlaceholder="Search IC transactions..."
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return (
          row.description.toLowerCase().includes(q) ||
          row.sourceCompanyName.toLowerCase().includes(q) ||
          row.mirrorCompanyName.toLowerCase().includes(q)
        );
      }}
      emptyMessage="No IC transactions match your search."
    />
  );
}
