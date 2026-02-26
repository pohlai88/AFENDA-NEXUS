'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataTable, type Column } from '@/components/erp/data-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { Receipt, Plus, Calendar, User, Building2 } from 'lucide-react';
import type { ExpenseClaim, ClaimStatus } from '../types';
import { claimStatusConfig } from '../types';

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ClaimStatus }) {
  const config = claimStatusConfig[status];
  return <Badge className={config.color}>{config.label}</Badge>;
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: Column<ExpenseClaim>[] = [
  {
    key: 'claimNumber',
    header: 'Claim #',
    sortable: true,
    render: (claim) => (
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono font-medium">{claim.claimNumber}</span>
      </div>
    ),
  },
  {
    key: 'employeeName',
    header: 'Employee',
    sortable: true,
    render: (claim) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {claim.employeeName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{claim.employeeName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {claim.department}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'title',
    header: 'Description',
    sortable: true,
    render: (claim) => (
      <div>
        <div className="font-medium">{claim.title}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(claim.periodFrom)} - {formatDate(claim.periodTo)}
        </div>
      </div>
    ),
  },
  {
    key: 'lineCount',
    header: 'Items',
    className: 'text-center',
    render: (claim) => <span className="text-sm">{claim.lineCount}</span>,
  },
  {
    key: 'totalAmount',
    header: 'Amount',
    sortable: true,
    className: 'text-right',
    render: (claim) => (
      <div className="text-right">
        <div className="font-mono font-medium">
          {formatCurrency(claim.totalAmount, claim.currency)}
        </div>
        {claim.approvedAmount !== null && claim.approvedAmount !== claim.totalAmount && (
          <div className="text-xs text-muted-foreground">
            Approved: {formatCurrency(claim.approvedAmount, claim.currency)}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'submittedDate',
    header: 'Submitted',
    sortable: true,
    render: (claim) => (
      <span className={cn(!claim.submittedDate && 'text-muted-foreground')}>
        {claim.submittedDate ? formatDate(claim.submittedDate) : 'Not submitted'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (claim) => <StatusBadge status={claim.status} />,
  },
];

// ─── Claims Table ────────────────────────────────────────────────────────────

interface ClaimsTableProps {
  claims: ExpenseClaim[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  showEmployee?: boolean;
}

export function ClaimsTable({ claims, pagination, showEmployee = true }: ClaimsTableProps) {
  const router = useRouter();

  const handleRowClick = (claim: ExpenseClaim) => {
    router.push(`${routes.finance.expenses}/${claim.id}`);
  };

  // Filter columns if we don't need to show employee
  const displayColumns = showEmployee
    ? columns
    : columns.filter((col) => col.key !== 'employeeName');

  return (
    <DataTable
      data={claims}
      columns={displayColumns}
      keyField="id"
      onRowClick={handleRowClick}
      pagination={pagination}
      searchKeys={['claimNumber', 'employeeName', 'expenseCategory']}
      searchPlaceholder="Search claims..."
      emptyState={{
        icon: Receipt,
        title: 'No expense claims found',
        description: 'Create your first expense claim to get started.',
        action: {
          label: 'New Claim',
          href: `${routes.finance.expenses}/new`,
        },
      }}
      actions={
        <Button asChild>
          <Link href={`${routes.finance.expenses}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Claim
          </Link>
        </Button>
      }
    />
  );
}
