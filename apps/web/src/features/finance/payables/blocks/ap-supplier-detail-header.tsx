'use client';

import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import type { SupplierDetail } from '../queries/ap-supplier.queries';

interface ApSupplierDetailHeaderProps {
  supplier: SupplierDetail;
}

export function ApSupplierDetailHeader({ supplier }: ApSupplierDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="font-mono text-base text-muted-foreground">{supplier.code}</span>
            {' — '}
            {supplier.name}
          </h1>
          <p className="text-sm text-muted-foreground">{supplier.companyName}</p>
        </div>
        <StatusBadge status={supplier.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Currency</p>
          <p className="text-sm font-medium">{supplier.currencyCode}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Tax ID</p>
          <p className="text-sm">{supplier.taxId ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
          <p className="text-sm">{supplier.defaultPaymentMethod?.replace(/_/g, ' ') ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Open Invoices</p>
          <p className="text-sm font-medium tabular-nums">{supplier.invoiceCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Open Balance</p>
          <MoneyCell amount={supplier.openBalance} currency={supplier.currencyCode} showCode />
        </div>
      </div>

      {supplier.remittanceEmail && (
        <p className="text-xs text-muted-foreground">
          Remittance email: {supplier.remittanceEmail}
        </p>
      )}
    </div>
  );
}
