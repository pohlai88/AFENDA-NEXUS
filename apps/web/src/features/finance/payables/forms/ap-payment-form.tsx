'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { routes } from '@/lib/constants';
import { recordApPaymentAction } from '../actions/ap.actions';
import type { ApInvoiceDetail } from '../queries/ap.queries';
import { MoneyCell } from '@/components/erp/money-cell';
import Link from 'next/link';

interface ApPaymentFormProps {
  invoice: ApInvoiceDetail;
}

export function ApPaymentForm({ invoice }: ApPaymentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [paymentRef, setPaymentRef] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }
    if (!paymentRef.trim()) {
      setError('Payment reference is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await recordApPaymentAction(
      invoice.id,
      numAmount,
      paymentDate,
      paymentRef.trim()
    );

    setSubmitting(false);

    if (result.ok) {
      showReceipt(result.value);
    } else {
      setError(result.error.message);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Payment Recorded"
        onClose={() => {
          clearReceipt();
          router.push(routes.finance.payableDetail(invoice.id));
        }}
        viewHref={routes.finance.payableDetail(invoice.id)}
        backHref={routes.finance.payables}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Invoice summary */}
      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Invoice</dt>
            <dd className="mt-1 text-sm font-mono font-medium">{invoice.invoiceNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Supplier</dt>
            <dd className="mt-1 text-sm">{invoice.supplierName}</dd>
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
      </div>

      {/* Payment fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="payment-amount">
            Payment Amount ({invoice.currencyCode}) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="payment-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="font-mono"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-date">
            Payment Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-ref">
            Payment Reference <span className="text-destructive">*</span>
          </Label>
          <Input
            id="payment-ref"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="e.g. CHK-001, EFT-123"
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href={routes.finance.payableDetail(invoice.id)}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Recording…' : 'Record Payment'}
        </Button>
      </div>
    </form>
  );
}
