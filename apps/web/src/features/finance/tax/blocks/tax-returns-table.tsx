'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/erp/data-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  Banknote,
  Plus,
} from 'lucide-react';
import type { TaxReturnPeriod, TaxReturnStatus, TaxReturnType } from '../types';
import { taxReturnStatusConfig, taxReturnTypeLabels } from '../types';

// ─── Status Badge ────────────────────────────────────────────────────────────

const statusIcons: Record<TaxReturnStatus, typeof CheckCircle> = {
  open: Clock,
  ready: FileCheck,
  filed: CheckCircle,
  paid: Banknote,
  overdue: AlertTriangle,
};

function StatusBadge({ status }: { status: TaxReturnStatus }) {
  const config = taxReturnStatusConfig[status];
  const Icon = statusIcons[status];

  return (
    <Badge className={cn('gap-1', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ─── Type Badge ──────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: TaxReturnType }) {
  return (
    <Badge variant="outline">
      {taxReturnTypeLabels[type]}
    </Badge>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: Column<TaxReturnPeriod>[] = [
  {
    key: 'periodName',
    header: 'Period',
    sortable: true,
    render: (period) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{period.periodName}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(period.startDate)} - {formatDate(period.endDate)}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'taxType',
    header: 'Tax Type',
    sortable: true,
    render: (period) => <TypeBadge type={period.taxType} />,
  },
  {
    key: 'outputTax',
    header: 'Output Tax',
    sortable: true,
    className: 'text-right',
    render: (period) => (
      <span className="font-mono">
        {formatCurrency(period.outputTax, period.currency)}
      </span>
    ),
  },
  {
    key: 'inputTax',
    header: 'Input Tax',
    sortable: true,
    className: 'text-right',
    render: (period) => (
      <span className="font-mono">
        {formatCurrency(period.inputTax, period.currency)}
      </span>
    ),
  },
  {
    key: 'netPayable',
    header: 'Net Payable',
    sortable: true,
    className: 'text-right',
    render: (period) => (
      <span
        className={cn(
          'font-mono font-medium',
          period.netPayable > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        )}
      >
        {formatCurrency(period.netPayable, period.currency)}
      </span>
    ),
  },
  {
    key: 'dueDate',
    header: 'Due Date',
    sortable: true,
    render: (period) => {
      const isOverdue = period.status !== 'paid' && new Date(period.dueDate) < new Date();
      return (
        <span className={cn(isOverdue && 'text-red-600 dark:text-red-400 font-medium')}>
          {formatDate(period.dueDate)}
        </span>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (period) => <StatusBadge status={period.status} />,
  },
  {
    key: 'actions',
    header: '',
    className: 'w-[100px]',
    render: (period) => (
      <div className="flex items-center justify-end">
        {period.status === 'ready' ? (
          <Button size="sm" variant="outline">
            File
          </Button>
        ) : period.status === 'filed' ? (
          <Button size="sm" variant="outline">
            Pay
          </Button>
        ) : (
          <Button size="sm" variant="ghost">
            View
          </Button>
        )}
      </div>
    ),
  },
];

// ─── Tax Returns Table ───────────────────────────────────────────────────────

interface TaxReturnsTableProps {
  periods: TaxReturnPeriod[];
}

export function TaxReturnsTable({ periods }: TaxReturnsTableProps) {
  const router = useRouter();

  const handleRowClick = (period: TaxReturnPeriod) => {
    router.push(`${routes.finance.tax}/returns/${period.id}`);
  };

  return (
    <DataTable
      data={periods}
      columns={columns}
      keyField="id"
      onRowClick={handleRowClick}
      emptyState={{
        icon: Calendar,
        title: 'No tax return periods',
        description: 'Tax return periods will appear here once configured.',
        action: {
          label: 'Create Period',
          href: `${routes.finance.tax}/returns/new`,
        },
      }}
      actions={
        <Button asChild>
          <Link href={`${routes.finance.tax}/returns/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Period
          </Link>
        </Button>
      }
    />
  );
}
