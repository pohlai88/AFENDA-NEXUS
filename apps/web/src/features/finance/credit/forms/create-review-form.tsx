'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReviewInputSchema, type CreateReviewInput } from '@afenda/contracts';
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

interface CreateReviewFormProps {
  onSubmit: (data: CreateReviewInput) => Promise<ApiResult<CommandReceipt>>;
  customerId?: string;
}

const reviewTypeOptions = [
  { value: 'periodic', label: 'Periodic' },
  { value: 'limit_increase', label: 'Limit Increase' },
  { value: 'new_customer', label: 'New Customer' },
  { value: 'risk_triggered', label: 'Risk Triggered' },
] as const;

const riskRatingOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
] as const;

export function CreateReviewForm({ onSubmit, customerId }: CreateReviewFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateReviewInput>({
    resolver: zodResolver(CreateReviewInputSchema),
    defaultValues: {
      customerId: customerId ?? '',
      reviewType: 'periodic',
      proposedLimit: 0,
      proposedRating: 'medium',
      justification: '',
    },
  });

  async function handleSubmit(data: CreateReviewInput) {
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
        title="Credit Review Created"
        onClose={clearReceipt}
        viewHref={routes.finance.creditReviews}
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
        {/* Review Type */}
        <div className="space-y-2">
          <Label htmlFor="reviewType">Review Type *</Label>
          <Select
            value={form.watch('reviewType')}
            onValueChange={(v) => form.setValue('reviewType', v as CreateReviewInput['reviewType'], { shouldValidate: true })}
          >
            <SelectTrigger id="reviewType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {reviewTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.reviewType && (
            <p className="text-xs text-destructive">{form.formState.errors.reviewType.message}</p>
          )}
        </div>

        {/* Proposed Rating */}
        <div className="space-y-2">
          <Label htmlFor="proposedRating">Proposed Rating *</Label>
          <Select
            value={form.watch('proposedRating')}
            onValueChange={(v) => form.setValue('proposedRating', v as CreateReviewInput['proposedRating'], { shouldValidate: true })}
          >
            <SelectTrigger id="proposedRating">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {riskRatingOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.proposedRating && (
            <p className="text-xs text-destructive">{form.formState.errors.proposedRating.message}</p>
          )}
        </div>
      </div>

      {/* Proposed Limit */}
      <div className="space-y-2">
        <Label htmlFor="proposedLimit">Proposed Limit *</Label>
        <Input
          id="proposedLimit"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 500000"
          {...form.register('proposedLimit', { valueAsNumber: true })}
        />
        {form.formState.errors.proposedLimit && (
          <p className="text-xs text-destructive">{form.formState.errors.proposedLimit.message}</p>
        )}
      </div>

      {/* Justification */}
      <div className="space-y-2">
        <Label htmlFor="justification">Justification *</Label>
        <Textarea
          id="justification"
          placeholder="Provide justification for this credit review..."
          rows={4}
          {...form.register('justification')}
        />
        {form.formState.errors.justification && (
          <p className="text-xs text-destructive">{form.formState.errors.justification.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating Review...' : 'Create Review'}
        </Button>
      </div>
    </form>
  );
}
