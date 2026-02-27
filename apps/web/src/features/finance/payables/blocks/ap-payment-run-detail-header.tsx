'use client';

import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { MoneyCell } from '@/components/erp/money-cell';
import type { PaymentRunDetail } from '../queries/ap-payment-run.queries';

interface ApPaymentRunDetailHeaderProps {
  run: PaymentRunDetail;
}

export function ApPaymentRunDetailHeader({ run }: ApPaymentRunDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{run.runNumber}</h1>
          <p className="text-sm text-muted-foreground">{run.companyName}</p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Run Date</p>
          <DateCell date={run.runDate} format="medium" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Cutoff Date</p>
          <DateCell date={run.cutoffDate} format="medium" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Items</p>
          <p className="text-sm font-medium tabular-nums">{run.itemCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
          <MoneyCell amount={run.totalNet} currency={run.currencyCode} showCode />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Discount</p>
          <MoneyCell amount={run.totalDiscount} currency={run.currencyCode} />
        </div>
      </div>

      {run.executedAt && (
        <p className="text-xs text-muted-foreground">
          Executed: <DateCell date={run.executedAt} format="medium" />
        </p>
      )}
      {run.cancelledAt && (
        <p className="text-xs text-destructive">
          Cancelled: <DateCell date={run.cancelledAt} format="medium" />
          {run.cancelReason && <> — {run.cancelReason}</>}
        </p>
      )}
    </div>
  );
}
