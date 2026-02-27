'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateArInvoiceSchema, type CreateArInvoice } from '@afenda/contracts';
import { ArInvoiceLinesEditor } from '../blocks/ar-invoice-lines-editor';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import Link from 'next/link';

interface ArInvoiceFormProps {
  onSubmit: (data: CreateArInvoice) => Promise<ApiResult<CommandReceipt>>;
  defaultCompanyId?: string;
  defaultLedgerId?: string;
}

export function ArInvoiceForm({ onSubmit, defaultCompanyId, defaultLedgerId }: ArInvoiceFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateArInvoice>({
    resolver: zodResolver(CreateArInvoiceSchema),
    defaultValues: {
      companyId: defaultCompanyId ?? '',
      ledgerId: defaultLedgerId ?? '',
      customerId: '',
      invoiceNumber: '',
      customerRef: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      currencyCode: '',
      description: '',
      lines: [
        { accountId: '', description: '', quantity: 1, unitPrice: 0, amount: 0, taxAmount: 0 },
      ],
    },
  });

  async function handleSubmit(data: CreateArInvoice) {
    setSubmitting(true);
    setError(null);

    const result = await onSubmit(data);

    setSubmitting(false);

    if (result.ok) {
      showReceipt(result.value);
      idempotencyKeyRef.current = crypto.randomUUID();
    } else {
      setError(result.error.message);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="AR Invoice Created"
        onClose={clearReceipt}
        viewHref={routes.finance.receivableDetail(receipt.resultRef)}
        backHref={routes.finance.receivables}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Row 1: Invoice Number + Customer */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">
            Invoice Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="invoiceNumber"
            {...form.register('invoiceNumber')}
            placeholder="e.g. INV-001"
          />
          {form.formState.errors.invoiceNumber && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.invoiceNumber.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerId">
            Customer ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerId"
            {...form.register('customerId')}
            placeholder="Select customer"
            className="font-mono text-xs"
          />
          {form.formState.errors.customerId && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.customerId.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Dates + Currency */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="invoiceDate">
            Invoice Date <span className="text-destructive">*</span>
          </Label>
          <Input id="invoiceDate" type="date" {...form.register('invoiceDate')} />
          {form.formState.errors.invoiceDate && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.invoiceDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">
            Due Date <span className="text-destructive">*</span>
          </Label>
          <Input id="dueDate" type="date" {...form.register('dueDate')} />
          {form.formState.errors.dueDate && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.dueDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencyCode">
            Currency <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currencyCode"
            {...form.register('currencyCode')}
            placeholder="USD"
            maxLength={3}
            className="uppercase"
          />
          {form.formState.errors.currencyCode && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.currencyCode.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Description + Customer Ref */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...form.register('description')}
            placeholder="Optional invoice description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerRef">Customer Ref</Label>
          <Input
            id="customerRef"
            {...form.register('customerRef')}
            placeholder="Customer reference"
          />
        </div>
      </div>

      {/* Lines Editor */}
      <ArInvoiceLinesEditor form={form} />

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
          <Link href={routes.finance.receivables}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
