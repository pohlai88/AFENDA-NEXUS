'use client';

import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { CustomerCreditView } from '../queries/credit.queries';
import { creditStatusConfig, riskRatingConfig } from '../types';

interface CreditDetailHeaderProps {
  credit: CustomerCreditView;
}

export function CreditDetailHeader({ credit }: CreditDetailHeaderProps) {
  const statusCfg = creditStatusConfig[credit.status as keyof typeof creditStatusConfig];
  const riskCfg = riskRatingConfig[credit.riskRating as keyof typeof riskRatingConfig];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{credit.customerName}</h2>
          {statusCfg && (
            <Badge className={statusCfg.color}>
              {statusCfg.label}
            </Badge>
          )}
          {riskCfg && (
            <Badge className={riskCfg.color}>
              {riskCfg.label} Risk
            </Badge>
          )}
          {credit.isOnHold && (
            <Badge variant="destructive">On Hold</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {credit.customerCode} · {credit.currency}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Credit Limit</p>
          <p className="text-sm font-semibold">{formatCurrency(credit.creditLimit, credit.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="text-sm font-semibold">{formatCurrency(credit.currentBalance, credit.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Available</p>
          <p className="text-sm font-semibold">{formatCurrency(credit.availableCredit, credit.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Utilization</p>
          <p className="text-sm font-semibold">{credit.utilizationPercent.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
