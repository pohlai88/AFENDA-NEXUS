'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AllocatePaymentSchema, type AllocatePayment } from '@afenda/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { routes } from '@/lib/constants';
import { allocateArPaymentAction } from '../actions/ar.actions';
import type { ArInvoiceDetail } from '../queries/ar.queries';
import { MoneyCell } from '@/components/erp/money-cell';
import Link from 'next/link';

interface ArAllocatePaymentFormProps {
  invoice: ArInvoiceDetail;
}

export function ArAllocatePaymentForm({ invoice }: ArAllocatePaymentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const form = useForm<AllocatePayment>({
    resolver: zodResolver(AllocatePaymentSchema),
    defaultValues: {
      customerId: invoice.customerId,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentRef: '',
      paymentAmount: undefined as unknown as number,
      currencyCode: invoice.currencyCode,
    },
  });

  async function handleSubmit(data: AllocatePayment) {
    setSubmitting(true);
    setServerError(null);

    const result = await allocateArPaymentAction(
      invoice.id,
      data.customerId,
      data.paymentDate,
      data.paymentRef,
      data.paymentAmount,
      data.currencyCode
    );

    setSubmitting(false);

    if (result.ok) {
      showReceipt(result.value);
    } else {
      setServerError(result.error.message);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Payment Allocated"
        onClose={() => {
          clearReceipt();
          router.push(routes.finance.receivableDetail(invoice.id));
        }}
        viewHref={routes.finance.receivableDetail(invoice.id)}
        backHref={routes.finance.receivables}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Invoice summary */}
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Invoice</dt>
              <dd className="mt-1 text-sm font-mono font-medium">{invoice.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Customer</dt>
              <dd className="mt-1 text-sm">{invoice.customerName}</dd>
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
          <FormField
            control={form.control}
            name="paymentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Payment Amount ({invoice.currencyCode}){' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="font-mono"
                    autoFocus
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Payment Date <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Payment Reference <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. PAY-001, EFT-123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {serverError && (
          <div
            className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={routes.finance.receivableDetail(invoice.id)}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Allocating…' : 'Allocate Payment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
