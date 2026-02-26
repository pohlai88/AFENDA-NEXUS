'use client';

import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import type { PortalInvoiceDetail } from '../queries/portal.queries';

interface PortalInvoiceDetailHeaderProps {
  invoice: PortalInvoiceDetail;
}

export function PortalInvoiceDetailHeader({ invoice }: PortalInvoiceDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{invoice.invoiceNumber}</h2>
          {invoice.description && (
            <p className="text-sm text-muted-foreground">{invoice.description}</p>
          )}
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Invoice Date</p>
          <DateCell date={invoice.invoiceDate} format="long" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Due Date</p>
          <DateCell date={invoice.dueDate} format="long" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
          <MoneyCell amount={invoice.totalAmount} currency={invoice.currencyCode} showCode />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Balance Due</p>
          <MoneyCell amount={invoice.balanceDue} currency={invoice.currencyCode} showCode />
        </div>
      </div>

      {invoice.supplierRef && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Supplier Reference</p>
          <p className="text-sm">{invoice.supplierRef}</p>
        </div>
      )}
    </div>
  );
}
