'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDTItemInputSchema } from '@afenda/contracts';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDeferredTaxItemAction } from '../actions/deferred-tax.actions';
import { routes } from '@/lib/constants';

type FormValues = z.infer<typeof CreateDTItemInputSchema>;

const taxTypeOptions = [
  { value: 'asset', label: 'Deferred Tax Asset (DTA)' },
  { value: 'liability', label: 'Deferred Tax Liability (DTL)' },
] as const;

const originTypeOptions = [
  { value: 'temporary_difference', label: 'Temporary Difference' },
  { value: 'tax_loss_carryforward', label: 'Tax Loss Carryforward' },
  { value: 'tax_credit', label: 'Tax Credit' },
] as const;

export function CreateDeferredTaxItemForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateDTItemInputSchema),
    defaultValues: {
      description: '',
      type: 'asset',
      originType: 'temporary_difference',
      bookBasis: 0,
      taxBasis: 0,
      taxRate: 25,
      jurisdiction: '',
      glAccountId: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createDeferredTaxItemAction(values);
      if (result.ok) {
        setFeedback({ ok: true, id: result.id });
        router.push(routes.finance.deferredTaxDetail(result.id));
      } else {
        setFeedback({ ok: false, error: result.error.message });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {feedback && !feedback.ok && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {feedback.error ?? 'An error occurred'}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Description */}
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" {...form.register('description')} placeholder="e.g. Depreciation - Equipment" />
          {form.formState.errors.description && (
            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Deferred Tax Type</Label>
          <Select
            value={form.watch('type')}
            onValueChange={(v) => form.setValue('type', v as FormValues['type'])}
          >
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {taxTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Origin Type */}
        <div className="space-y-2">
          <Label htmlFor="originType">Origin Type</Label>
          <Select
            value={form.watch('originType')}
            onValueChange={(v) => form.setValue('originType', v as FormValues['originType'])}
          >
            <SelectTrigger id="originType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {originTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Book Basis */}
        <div className="space-y-2">
          <Label htmlFor="bookBasis">Book Basis</Label>
          <Input
            id="bookBasis"
            type="number"
            {...form.register('bookBasis', { valueAsNumber: true })}
          />
          {form.formState.errors.bookBasis && (
            <p className="text-sm text-destructive">{form.formState.errors.bookBasis.message}</p>
          )}
        </div>

        {/* Tax Basis */}
        <div className="space-y-2">
          <Label htmlFor="taxBasis">Tax Basis</Label>
          <Input
            id="taxBasis"
            type="number"
            {...form.register('taxBasis', { valueAsNumber: true })}
          />
          {form.formState.errors.taxBasis && (
            <p className="text-sm text-destructive">{form.formState.errors.taxBasis.message}</p>
          )}
        </div>

        {/* Tax Rate */}
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.01"
            min={0}
            max={100}
            {...form.register('taxRate', { valueAsNumber: true })}
          />
          {form.formState.errors.taxRate && (
            <p className="text-sm text-destructive">{form.formState.errors.taxRate.message}</p>
          )}
        </div>

        {/* Jurisdiction */}
        <div className="space-y-2">
          <Label htmlFor="jurisdiction">Jurisdiction</Label>
          <Input id="jurisdiction" {...form.register('jurisdiction')} placeholder="e.g. US" />
          {form.formState.errors.jurisdiction && (
            <p className="text-sm text-destructive">{form.formState.errors.jurisdiction.message}</p>
          )}
        </div>

        {/* GL Account */}
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="glAccountId">GL Account ID</Label>
          <Input id="glAccountId" {...form.register('glAccountId')} placeholder="Select GL account" />
          {form.formState.errors.glAccountId && (
            <p className="text-sm text-destructive">{form.formState.errors.glAccountId.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create Deferred Tax Item'}
        </Button>
      </div>
    </form>
  );
}
