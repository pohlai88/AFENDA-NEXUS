'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, CreditCard, AlertTriangle, Ban, Building2 } from 'lucide-react';
import type { CustomerCredit, CreditStatus, RiskRating } from '../types';
import { creditStatusConfig, riskRatingConfig } from '../types';
import { routes } from '@/lib/constants';

function StatusBadge({ status }: { status: CreditStatus }) {
  const config = creditStatusConfig[status];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function RiskBadge({ rating }: { rating: RiskRating }) {
  const config = riskRatingConfig[rating];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function UtilizationGauge({ percent, isOnHold }: { percent: number; isOnHold: boolean }) {
  const getColor = () => {
    if (isOnHold) return '[&>div]:bg-destructive';
    if (percent >= 90) return '[&>div]:bg-destructive';
    if (percent >= 75) return '[&>div]:bg-warning';
    return '';
  };

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <Progress value={Math.min(percent, 100)} className={cn('h-2 flex-1', getColor())} />
      <span className={cn('text-xs font-mono', percent >= 90 && 'text-destructive')}>
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

interface CustomerCreditsTableProps {
  credits: CustomerCredit[];
}

export function CustomerCreditsTable({ credits }: CustomerCreditsTableProps) {
  const router = useRouter();

  const columns: Column<CustomerCredit>[] = [
    {
      key: 'customerCode',
      header: 'Customer',
      sortable: true,
      render: (credit) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{credit.customerName}</div>
            <div className="text-xs text-muted-foreground font-mono">{credit.customerCode}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      sortable: true,
      render: (credit) => (
        <span className="font-mono">{formatCurrency(credit.creditLimit, credit.currency)}</span>
      ),
    },
    {
      key: 'currentBalance',
      header: 'Balance',
      align: 'right',
      sortable: true,
      render: (credit) => (
        <div className="text-right">
          <div className="font-mono">{formatCurrency(credit.currentBalance, credit.currency)}</div>
          {credit.overdueAmount > 0 && (
            <div className="text-xs text-destructive flex items-center justify-end gap-1">
              <AlertTriangle className="h-3 w-3" />
              {formatCurrency(credit.overdueAmount, credit.currency)} overdue
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'utilizationPercent',
      header: 'Utilization',
      render: (credit) => (
        <UtilizationGauge percent={credit.utilizationPercent} isOnHold={credit.isOnHold} />
      ),
    },
    {
      key: 'avgPaymentDays',
      header: 'Avg Pay Days',
      align: 'center',
      sortable: true,
      render: (credit) => (
        <span
          className={cn(
            'font-mono',
            credit.avgPaymentDays > credit.paymentTermsDays && 'text-warning'
          )}
        >
          {credit.avgPaymentDays}
          <span className="text-xs text-muted-foreground"> / {credit.paymentTermsDays}</span>
        </span>
      ),
    },
    {
      key: 'creditScoreInternal',
      header: 'Score',
      align: 'center',
      sortable: true,
      render: (credit) => (
        <span
          className={cn(
            'font-mono',
            credit.creditScoreInternal >= 70
              ? 'text-success'
              : credit.creditScoreInternal >= 50
                ? 'text-warning'
                : 'text-destructive'
          )}
        >
          {credit.creditScoreInternal}
        </span>
      ),
    },
    {
      key: 'riskRating',
      header: 'Risk',
      render: (credit) => <RiskBadge rating={credit.riskRating} />,
    },
    {
      key: 'nextReviewDate',
      header: 'Next Review',
      sortable: true,
      render: (credit) =>
        credit.nextReviewDate ? (
          <span className="text-sm">{formatDate(credit.nextReviewDate)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (credit) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={credit.status} />
          {credit.isOnHold && (
            <span className="text-destructive">
              <Ban className="h-4 w-4" />
            </span>
          )}
        </div>
      ),
    },
  ];

  const handleRowClick = (credit: CustomerCredit) => {
    router.push(routes.finance.creditLimitDetail(credit.id));
  };

  return (
    <DataTable
      data={credits}
      columns={columns}
      searchPlaceholder="Search customers..."
      searchKeys={['customerCode', 'customerName']}
      onRowClick={handleRowClick}
      emptyState={{
        icon: CreditCard,
        title: 'No customer credits',
        description: 'Set up credit limits for your customers.',
        action: (
          <Button asChild>
            <Link href={routes.finance.creditNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Credit Limit
            </Link>
          </Button>
        ),
      }}
      actions={
        <Button asChild>
          <Link href={routes.finance.creditNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Credit Limit
          </Link>
        </Button>
      }
    />
  );
}
