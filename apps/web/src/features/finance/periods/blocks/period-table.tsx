'use client';

import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { StatusBadge } from '@/components/erp/status-badge';
import { PeriodActions } from './period-actions';
import type { PeriodListItem } from '../queries/period.queries';

const columns: ColumnDef<PeriodListItem>[] = [
  {
    id: 'period',
    header: 'Period',
    className: 'w-[60px]',
    sortable: true,
    sortFn: (a, b) => a.period - b.period,
    accessorFn: (row) => <span className="font-mono text-xs">P{row.period}</span>,
  },
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    sortFn: (a, b) => a.name.localeCompare(b.name),
    accessorFn: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'startDate',
    header: 'Start Date',
    className: 'w-[120px]',
    sortable: true,
    sortFn: (a, b) => a.startDate.localeCompare(b.startDate),
    accessorFn: (row) => <span className="text-xs text-muted-foreground">{row.startDate}</span>,
  },
  {
    id: 'endDate',
    header: 'End Date',
    className: 'w-[120px]',
    sortable: true,
    sortFn: (a, b) => a.endDate.localeCompare(b.endDate),
    accessorFn: (row) => <span className="text-xs text-muted-foreground">{row.endDate}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    className: 'w-[100px]',
    sortable: true,
    sortFn: (a, b) => a.status.localeCompare(b.status),
    accessorFn: (row) => <StatusBadge status={row.status} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    className: 'w-[200px]',
    accessorFn: (row) => (
      <PeriodActions periodId={row.id} periodName={row.name} status={row.status} />
    ),
  },
];

interface PeriodTableProps {
  data: PeriodListItem[];
}

export function PeriodTable({ data }: PeriodTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyFn={(row) => row.id}
      emptyMessage="No periods found."
    />
  );
}
