'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RecordApPaymentSchema, type RecordApPayment } from '@afenda/contracts';
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

  const form = useForm<RecordApPayment>({
    resolver: zodResolver(RecordApPaymentSchema),
    defaultValues: {
      amount: undefined,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentRef: '',
    },
  });

  async function handleSubmit(data: RecordApPayment) {
    setSubmitting(true);
    setError(null);

    const result = await recordApPaymentAction(
      invoice.id,
      data.amount,
      data.paymentDate,
      data.paymentRef
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
            {...form.register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            className="font-mono"
            autoFocus
          />
          {form.formState.errors.amount && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.amount.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-date">
            Payment Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="payment-date"
            type="date"
            {...form.register('paymentDate')}
          />
          {form.formState.errors.paymentDate && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.paymentDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-ref">
            Payment Reference <span className="text-destructive">*</span>
          </Label>
          <Input
            id="payment-ref"
            {...form.register('paymentRef')}
            placeholder="e.g. CHK-001, EFT-123"
          />
          {form.formState.errors.paymentRef && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.paymentRef.message}
            </p>
          )}
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
