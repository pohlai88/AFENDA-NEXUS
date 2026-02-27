'use client';

import Link from 'next/link';
import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import { RecurringTemplateActions } from './recurring-template-actions';
import { routes } from '@/lib/constants';
import type { RecurringTemplateListItem } from '../queries/recurring.queries';

const columns: ColumnDef<RecurringTemplateListItem>[] = [
  {
    id: 'description',
    header: 'Description',
    sortable: true,
    sortFn: (a, b) => a.description.localeCompare(b.description),
    accessorFn: (row) => (
      <Link href={routes.finance.recurringDetail(row.id)} className="font-medium hover:underline">
        {row.description}
      </Link>
    ),
  },
  {
    id: 'frequency',
    header: 'Frequency',
    sortable: true,
    sortFn: (a, b) => a.frequency.localeCompare(b.frequency),
    accessorFn: (row) => <Badge variant="outline">{row.frequency}</Badge>,
  },
  {
    id: 'nextRunDate',
    header: 'Next Run',
    sortable: true,
    sortFn: (a, b) => a.nextRunDate.localeCompare(b.nextRunDate),
    accessorFn: (row) => <DateCell date={row.nextRunDate} />,
  },
  {
    id: 'lineCount',
    header: 'Lines',
    sortable: true,
    sortFn: (a, b) => a.lineCount - b.lineCount,
    accessorFn: (row) => row.lineCount,
  },
  {
    id: 'isActive',
    header: 'Status',
    sortable: true,
    sortFn: (a, b) => Number(b.isActive) - Number(a.isActive),
    accessorFn: (row) => <StatusBadge status={row.isActive ? 'OPEN' : 'CLOSED'} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    className: 'text-right',
    accessorFn: (row) => (
      <RecurringTemplateActions
        templateId={row.id}
        templateName={row.description}
        isActive={row.isActive}
      />
    ),
  },
];

interface RecurringTemplateTableProps {
  data: RecurringTemplateListItem[];
}

export function RecurringTemplateTable({ data }: RecurringTemplateTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyFn={(row) => row.id}
      searchPlaceholder="Search templates..."
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return row.description.toLowerCase().includes(q);
      }}
      emptyState={{ key: 'finance.recurring' }}
    />
  );
}
