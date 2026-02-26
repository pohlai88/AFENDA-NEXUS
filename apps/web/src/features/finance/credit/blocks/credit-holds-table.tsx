'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Ban, CheckCircle2, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { releaseCreditHold } from '../actions/credit.actions';
import type { CreditHold, HoldStatus, HoldType } from '../types';
import { holdStatusConfig, holdTypeLabels } from '../types';
import { routes } from '@/lib/constants';

function StatusBadge({ status }: { status: HoldStatus }) {
  const config = holdStatusConfig[status];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: HoldType }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {holdTypeLabels[type]}
    </Badge>
  );
}

interface CreditHoldsTableProps {
  holds: CreditHold[];
}

export function CreditHoldsTable({ holds }: CreditHoldsTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleRelease = (hold: CreditHold) => {
    startTransition(async () => {
      const result = await releaseCreditHold(hold.id, 'Released via hold management');
      if (result.ok) {
        toast.success(`Credit hold released for ${hold.customerName}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns: Column<CreditHold>[] = [
    {
      key: 'customerCode',
      header: 'Customer',
      sortable: true,
      render: (hold) => (
        <div>
          <div className="font-medium">{hold.customerName}</div>
          <div className="text-xs text-muted-foreground font-mono">{hold.customerCode}</div>
        </div>
      ),
    },
    {
      key: 'holdType',
      header: 'Type',
      render: (hold) => <TypeBadge type={hold.holdType} />,
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (hold) => (
        <div className="max-w-[200px]">
          <p className="text-sm truncate">{hold.reason}</p>
          {hold.amount && (
            <span className="text-xs text-muted-foreground font-mono">
              {formatCurrency(hold.amount, hold.currency)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'blockedOrders',
      header: 'Blocked Orders',
      align: 'center',
      render: (hold) => (
        <div className="flex items-center justify-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{hold.blockedOrders}</span>
          {hold.blockedOrderValue > 0 && (
            <span className="text-xs text-muted-foreground">
              ({formatCurrency(hold.blockedOrderValue, hold.currency)})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'holdDate',
      header: 'Hold Date',
      sortable: true,
      render: (hold) => (
        <div className="text-sm">
          <div>{formatDate(hold.holdDate)}</div>
          <div className="text-xs text-muted-foreground">by {hold.holdBy}</div>
        </div>
      ),
    },
    {
      key: 'autoRelease',
      header: 'Auto Release',
      render: (hold) =>
        hold.autoRelease ? (
          <span className="text-xs text-success">{hold.autoReleaseCondition}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Manual</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (hold) => <StatusBadge status={hold.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (hold) =>
        hold.status === 'active' && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRelease(hold);
              }}
              disabled={isPending}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Release
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={routes.finance.creditHoldDetail(hold.id)}>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ),
    },
  ];

  return (
    <DataTable
      data={holds}
      columns={columns}
      searchPlaceholder="Search holds..."
      searchKeys={['customerCode', 'customerName', 'reason']}
      emptyState={{
        icon: Ban,
        title: 'No credit holds',
        description: 'No customers are currently on credit hold.',
      }}
    />
  );
}
