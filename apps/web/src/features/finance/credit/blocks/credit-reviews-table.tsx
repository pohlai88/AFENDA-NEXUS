'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/erp/data-table';
import { routes } from '@/lib/constants';
import type { CreditReviewView } from '../queries/credit.queries';
import { reviewStatusConfig, reviewTypeLabels } from '../types';

interface CreditReviewsTableProps {
  reviews: CreditReviewView[];
}

const columns: Column<CreditReviewView>[] = [
  {
    key: 'reviewNumber',
    header: 'Review #',
    render: (r) => <span>{r.reviewNumber}</span>,
  },
  {
    key: 'customerName',
    header: 'Customer',
    render: (r) => (
      <div>
        <p className="font-medium">{r.customerName}</p>
        <p className="text-xs text-muted-foreground">{r.customerCode}</p>
      </div>
    ),
  },
  {
    key: 'reviewType',
    header: 'Type',
    render: (r) => {
      const label = reviewTypeLabels[r.reviewType as keyof typeof reviewTypeLabels];
      return <span>{label ?? r.reviewType}</span>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (r) => {
      const cfg = reviewStatusConfig[r.status as keyof typeof reviewStatusConfig];
      return cfg ? (
        <Badge className={cfg.color}>
          {cfg.label}
        </Badge>
      ) : (
        <span>{r.status}</span>
      );
    },
  },
  {
    key: 'currentLimit',
    header: 'Current Limit',
    render: (r) => (
      <span>{r.currentLimit.toLocaleString()} {r.currency}</span>
    ),
  },
  {
    key: 'proposedLimit',
    header: 'Proposed Limit',
    render: (r) => (
      <span>{r.proposedLimit.toLocaleString()} {r.currency}</span>
    ),
  },
  {
    key: 'dueDate',
    header: 'Due Date',
    render: (r) => <span>{r.dueDate}</span>,
  },
  {
    key: 'assignedTo',
    header: 'Assigned To',
    render: (r) => (
      <span>{r.assignedTo ?? '—'}</span>
    ),
  },
];

export function CreditReviewsTable({ reviews }: CreditReviewsTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={reviews}
      searchKeys={["customerName"]}
      searchPlaceholder="Search reviews…"
      onRowClick={(row) => router.push(`${routes.finance.creditReviews}/${row.id}`)}
    />
  );
}
