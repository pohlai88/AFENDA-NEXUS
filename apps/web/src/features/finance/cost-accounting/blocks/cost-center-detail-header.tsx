'use client';

import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import type { CostCenterDetail } from '../queries/cost-accounting.queries';

interface CostCenterDetailHeaderProps {
  costCenter: CostCenterDetail;
}

export function CostCenterDetailHeader({ costCenter }: CostCenterDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{costCenter.name}</h2>
            <StatusBadge status={costCenter.status} />
          </div>
          <p className="text-sm text-muted-foreground">{costCenter.code}</p>
        </div>
      </div>

      {costCenter.description && (
        <p className="text-sm text-muted-foreground">{costCenter.description}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailField label="Type" value={costCenter.type} />
        <DetailField label="Level" value={String(costCenter.level)} />
        <DetailField
          label="Budget"
          value={
            <MoneyCell
              amount={costCenter.budgetAmount}
              currency={costCenter.currencyCode}
            />
          }
        />
        <DetailField
          label="Actual"
          value={
            <MoneyCell
              amount={costCenter.actualAmount}
              currency={costCenter.currencyCode}
            />
          }
        />
        {costCenter.parentName && (
          <DetailField label="Parent" value={`${costCenter.parentCode} — ${costCenter.parentName}`} />
        )}
        {costCenter.managerName && (
          <DetailField label="Manager" value={costCenter.managerName} />
        )}
        <DetailField label="Effective From" value={<DateCell date={costCenter.effectiveFrom} />} />
        {costCenter.effectiveTo && (
          <DetailField label="Effective To" value={<DateCell date={costCenter.effectiveTo} />} />
        )}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
