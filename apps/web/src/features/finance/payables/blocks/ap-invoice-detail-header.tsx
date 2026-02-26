import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { MoneyCell } from '@/components/erp/money-cell';
import type { ApInvoiceDetail } from '../queries/ap.queries';

interface ApInvoiceDetailHeaderProps {
  invoice: ApInvoiceDetail;
}

export function ApInvoiceDetailHeader({ invoice }: ApInvoiceDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono">{invoice.invoiceNumber}</h2>
          <p className="text-sm text-muted-foreground">{invoice.supplierName}</p>
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

      {/* Optional reference fields */}
      {(invoice.supplierRef || invoice.poRef || invoice.receiptRef) && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
          {invoice.supplierRef && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Supplier Ref</dt>
              <dd className="mt-1 text-sm font-mono">{invoice.supplierRef}</dd>
            </div>
          )}
          {invoice.poRef && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground">PO Reference</dt>
              <dd className="mt-1 text-sm font-mono">{invoice.poRef}</dd>
            </div>
          )}
          {invoice.receiptRef && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Receipt Ref</dt>
              <dd className="mt-1 text-sm font-mono">{invoice.receiptRef}</dd>
            </div>
          )}
        </div>
      )}

      {invoice.cancelReason && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm">
          <strong>Cancelled:</strong> {invoice.cancelReason}
        </div>
      )}
    </div>
  );
}
