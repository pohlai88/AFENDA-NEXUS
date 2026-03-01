'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePolicyInputSchema } from '@afenda/contracts';
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
import { createPolicyAction } from '../actions/transfer-pricing.actions';
import { routes } from '@/lib/constants';

type FormValues = z.infer<typeof CreatePolicyInputSchema>;

const transactionTypeOptions = [
  { value: 'goods', label: 'Goods' },
  { value: 'services', label: 'Services' },
  { value: 'royalties', label: 'Royalties' },
  { value: 'financing', label: 'Financing' },
  { value: 'cost_sharing', label: 'Cost Sharing' },
] as const;

const pricingMethodOptions = [
  { value: 'cup', label: 'CUP' },
  { value: 'resale_price', label: 'Resale Price' },
  { value: 'cost_plus', label: 'Cost Plus' },
  { value: 'tnmm', label: 'TNMM' },
  { value: 'profit_split', label: 'Profit Split' },
] as const;

export function CreatePolicyForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreatePolicyInputSchema),
    defaultValues: {
      name: '',
      transactionType: 'goods',
      pricingMethod: 'cup',
      entities: [],
      armLengthRange: { min: 0, max: 0 },
      targetMargin: 0,
      effectiveFrom: new Date(),
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createPolicyAction(values);
      if (result.ok) {
        setFeedback({ ok: true, id: result.id });
        router.push(routes.finance.transferPricingDetail(result.id));
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
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="name">Policy Name</Label>
          <Input id="name" {...form.register('name')} placeholder="e.g. IC Services - US to DE" />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transactionType">Transaction Type</Label>
          <Select
            value={form.watch('transactionType')}
            onValueChange={(v) => form.setValue('transactionType', v as FormValues['transactionType'])}
          >
            <SelectTrigger id="transactionType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {transactionTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricingMethod">Pricing Method</Label>
          <Select
            value={form.watch('pricingMethod')}
            onValueChange={(v) => form.setValue('pricingMethod', v as FormValues['pricingMethod'])}
          >
            <SelectTrigger id="pricingMethod"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pricingMethodOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="armLengthMin">Arm&apos;s Length Range Min (%)</Label>
          <Input
            id="armLengthMin"
            type="number"
            step="0.1"
            {...form.register('armLengthRange.min', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="armLengthMax">Arm&apos;s Length Range Max (%)</Label>
          <Input
            id="armLengthMax"
            type="number"
            step="0.1"
            {...form.register('armLengthRange.max', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetMargin">Target Margin (%)</Label>
          <Input
            id="targetMargin"
            type="number"
            step="0.1"
            {...form.register('targetMargin', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="effectiveFrom">Effective From</Label>
          <Input id="effectiveFrom" type="date" {...form.register('effectiveFrom', { valueAsDate: true })} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create Policy'}
        </Button>
      </div>
    </form>
  );
}
