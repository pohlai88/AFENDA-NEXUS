'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlaceHoldInputSchema, type PlaceHoldInput } from '@afenda/contracts';
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

interface PlaceHoldFormProps {
  onSubmit: (data: PlaceHoldInput) => Promise<ApiResult<CommandReceipt>>;
  customerId?: string;
}

const holdTypeOptions = [
  { value: 'credit_limit', label: 'Credit Limit' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'manual', label: 'Manual' },
  { value: 'payment_terms', label: 'Payment Terms' },
] as const;

export function PlaceHoldForm({ onSubmit, customerId }: PlaceHoldFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<PlaceHoldInput>({
    resolver: zodResolver(PlaceHoldInputSchema),
    defaultValues: {
      customerId: customerId ?? '',
      holdType: 'manual',
      reason: '',
      amount: undefined,
    },
  });

  async function handleSubmit(data: PlaceHoldInput) {
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
        title="Credit Hold Placed"
        onClose={clearReceipt}
        viewHref={routes.finance.creditLimits}
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

      {/* Hold Type */}
      <div className="space-y-2">
        <Label htmlFor="holdType">Hold Type *</Label>
        <Select
          value={form.watch('holdType')}
          onValueChange={(v) => form.setValue('holdType', v as PlaceHoldInput['holdType'], { shouldValidate: true })}
        >
          <SelectTrigger id="holdType">
            <SelectValue placeholder="Select hold type" />
          </SelectTrigger>
          <SelectContent>
            {holdTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.holdType && (
          <p className="text-xs text-destructive">{form.formState.errors.holdType.message}</p>
        )}
      </div>

      {/* Amount (optional) */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Optional hold amount"
          {...form.register('amount', { valueAsNumber: true })}
        />
        {form.formState.errors.amount && (
          <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
        )}
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">Reason *</Label>
        <Textarea
          id="reason"
          placeholder="Describe the reason for placing this hold..."
          rows={3}
          {...form.register('reason')}
        />
        {form.formState.errors.reason && (
          <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="destructive" disabled={submitting}>
          {submitting ? 'Placing Hold...' : 'Place Credit Hold'}
        </Button>
      </div>
    </form>
  );
}
