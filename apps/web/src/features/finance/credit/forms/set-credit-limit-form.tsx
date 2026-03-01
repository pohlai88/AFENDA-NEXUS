'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SetCreditLimitInputSchema, type SetCreditLimitInput } from '@afenda/contracts';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';

interface SetCreditLimitFormProps {
  onSubmit: (data: SetCreditLimitInput) => Promise<ApiResult<CommandReceipt>>;
  customerId?: string;
}

const reviewFrequencyOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
] as const;

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'ZAR', label: 'ZAR' },
] as const;

export function SetCreditLimitForm({ onSubmit, customerId }: SetCreditLimitFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<SetCreditLimitInput>({
    resolver: zodResolver(SetCreditLimitInputSchema),
    defaultValues: {
      customerId: customerId ?? '',
      creditLimit: 0,
      currency: 'USD',
      paymentTermsDays: 30,
      reviewFrequency: 'quarterly',
      notes: '',
    },
  });

  async function handleSubmit(data: SetCreditLimitInput) {
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
        title="Credit Limit Set"
        onClose={clearReceipt}
        viewHref={routes.finance.creditLimitDetail(receipt.resultRef)}
        backHref={routes.finance.creditLimits}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Customer ID */}
      {!customerId && (
        <div className="space-y-2">
          <Label htmlFor="customerId">Customer ID *</Label>
          <Input
            id="customerId"
            placeholder="Select customer"
            {...form.register('customerId')}
          />
          {form.formState.errors.customerId && (
            <p className="text-xs text-destructive">{form.formState.errors.customerId.message}</p>
          )}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Credit Limit */}
        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit Limit *</Label>
          <Input
            id="creditLimit"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 500000"
            {...form.register('creditLimit', { valueAsNumber: true })}
          />
          {form.formState.errors.creditLimit && (
            <p className="text-xs text-destructive">{form.formState.errors.creditLimit.message}</p>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(v) => form.setValue('currency', v, { shouldValidate: true })}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.currency && (
            <p className="text-xs text-destructive">{form.formState.errors.currency.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Payment Terms */}
        <div className="space-y-2">
          <Label htmlFor="paymentTermsDays">Payment Terms (Days) *</Label>
          <Input
            id="paymentTermsDays"
            type="number"
            min="1"
            placeholder="e.g. 30"
            {...form.register('paymentTermsDays', { valueAsNumber: true })}
          />
          {form.formState.errors.paymentTermsDays && (
            <p className="text-xs text-destructive">{form.formState.errors.paymentTermsDays.message}</p>
          )}
        </div>

        {/* Review Frequency */}
        <div className="space-y-2">
          <Label htmlFor="reviewFrequency">Review Frequency *</Label>
          <Select
            value={form.watch('reviewFrequency')}
            onValueChange={(v) => form.setValue('reviewFrequency', v as 'monthly' | 'quarterly' | 'annually', { shouldValidate: true })}
          >
            <SelectTrigger id="reviewFrequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {reviewFrequencyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.reviewFrequency && (
            <p className="text-xs text-destructive">{form.formState.errors.reviewFrequency.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Optional notes about this credit limit decision..."
          rows={3}
          {...form.register('notes')}
        />
        {form.formState.errors.notes && (
          <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Setting Limit...' : 'Set Credit Limit'}
        </Button>
      </div>
    </form>
  );
}
