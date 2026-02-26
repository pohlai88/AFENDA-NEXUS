import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { MoneyCell } from '@/components/erp/money-cell';
import type { ArInvoiceDetail } from '../queries/ar.queries';

interface ArInvoiceDetailHeaderProps {
  invoice: ArInvoiceDetail;
}

export function ArInvoiceDetailHeader({ invoice }: ArInvoiceDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono">{invoice.invoiceNumber}</h2>
          <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
          {invoice.description && (
            <p className="mt-1 text-sm text-muted-foreground">{invoice.description}</p>
          )}
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Invoice Date</dt>
          <dd className="mt-1">
            <DateCell date={invoice.invoiceDate} format="medium" />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Due Date</dt>
          <dd className="mt-1">
            <DateCell date={invoice.dueDate} format="medium" />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Total Amount</dt>
          <dd className="mt-1">
            <MoneyCell amount={invoice.totalAmount} currency={invoice.currencyCode} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Balance Due</dt>
          <dd className="mt-1">
            <MoneyCell amount={invoice.balanceDue} currency={invoice.currencyCode} />
          </dd>
        </div>
      </div>

      {invoice.customerRef && (
        <div className="rounded-lg border p-4">
          <dt className="text-xs font-medium text-muted-foreground">Customer Ref</dt>
          <dd className="mt-1 text-sm font-mono">{invoice.customerRef}</dd>
        </div>
      )}

      {invoice.cancelReason && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm">
          <strong>Cancelled:</strong> {invoice.cancelReason}
        </div>
      )}

      {invoice.writeOffReason && (
        <div className="rounded-md border border-border bg-muted p-3 text-sm">
          <strong>Written Off:</strong> {invoice.writeOffReason}
        </div>
      )}
    </div>
  );
}
