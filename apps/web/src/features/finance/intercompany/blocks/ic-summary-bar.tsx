import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { Separator } from '@/components/ui/separator';

// ─── IC Transaction Summary Bar ─────────────────────────────────────────────

interface IcSummaryBarProps {
  settlementStatus: string;
  amount: number;
  currency: string;
  transactionDate: string;
  sourceCompanyName: string;
  mirrorCompanyName: string;
}

export function IcSummaryBar({
  settlementStatus,
  amount,
  currency,
  transactionDate,
  sourceCompanyName,
  mirrorCompanyName,
}: IcSummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-md border p-4">
      <div>
        <span className="text-xs text-muted-foreground">Status</span>
        <div className="mt-1">
          <StatusBadge status={settlementStatus} />
        </div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Amount</span>
        <div className="mt-1 font-mono text-sm">
          <MoneyCell amount={amount} currency={currency} />
        </div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Date</span>
        <div className="mt-1 text-sm">
          <DateCell date={transactionDate} format="medium" />
        </div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Source</span>
        <div className="mt-1 text-sm font-medium">{sourceCompanyName}</div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Mirror</span>
        <div className="mt-1 text-sm font-medium">{mirrorCompanyName}</div>
      </div>
    </div>
  );
}
