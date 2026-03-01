'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { createFxRateAction } from '../actions/fx.actions';
import type { CommandReceipt } from '@/lib/types';
import { Plus } from 'lucide-react';

const CreateFxRateSchema = z.object({
  fromCurrency: z.string().length(3, 'Must be a 3-letter currency code').toUpperCase(),
  toCurrency: z.string().length(3, 'Must be a 3-letter currency code').toUpperCase(),
  rate: z.string().min(1, 'Rate is required'),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  source: z.string().optional(),
});

type CreateFxRateInput = z.infer<typeof CreateFxRateSchema>;

export function CreateFxRateForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateFxRateInput>({
    resolver: zodResolver(CreateFxRateSchema),
    defaultValues: {
      fromCurrency: '',
      toCurrency: '',
      rate: '',
      effectiveDate: '',
      source: '',
    },
  });

  async function handleSubmit(data: CreateFxRateInput) {
    setSubmitting(true);
    setError(null);

    const result = await createFxRateAction({
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      rate: data.rate,
      effectiveDate: data.effectiveDate,
      source: data.source || undefined,
    });

    setSubmitting(false);

    if (result.ok) {
      setReceipt(result.value);
      form.reset();
      router.refresh();
    } else {
      setError(result.error.message);
    }
  }

  if (receipt) {
    return (
      <ReceiptPanel receipt={receipt} title="FX rate created" onClose={() => setReceipt(null)} />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Add FX Rate</h3>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="fromCurrency">From *</Label>
          <Input
            id="fromCurrency"
            placeholder="USD"
            maxLength={3}
            className="uppercase"
            {...form.register('fromCurrency')}
          />
          {form.formState.errors.fromCurrency && (
            <p className="text-xs text-destructive">
              {form.formState.errors.fromCurrency.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="toCurrency">To *</Label>
          <Input
            id="toCurrency"
            placeholder="EUR"
            maxLength={3}
            className="uppercase"
            {...form.register('toCurrency')}
          />
          {form.formState.errors.toCurrency && (
            <p className="text-xs text-destructive">
              {form.formState.errors.toCurrency.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rate">Rate *</Label>
          <Input
            id="rate"
            placeholder="1.0850"
            type="text"
            inputMode="decimal"
            {...form.register('rate')}
          />
          {form.formState.errors.rate && (
            <p className="text-xs text-destructive">{form.formState.errors.rate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effectiveDate">Effective *</Label>
          <Input id="effectiveDate" type="date" {...form.register('effectiveDate')} />
          {form.formState.errors.effectiveDate && (
            <p className="text-xs text-destructive">
              {form.formState.errors.effectiveDate.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Input id="source" placeholder="manual" {...form.register('source')} />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={submitting}>
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {submitting ? 'Creating…' : 'Create Rate'}
      </Button>
    </form>
  );
}
