'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesignateHedgeInputSchema } from '@afenda/contracts';
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
import { designateHedgeAction } from '../actions/hedging.actions';
import { routes } from '@/lib/constants';

type FormValues = z.infer<typeof DesignateHedgeInputSchema>;

const hedgeTypeOptions = [
  { value: 'FAIR_VALUE', label: 'Fair Value Hedge' },
  { value: 'CASH_FLOW', label: 'Cash Flow Hedge' },
  { value: 'NET_INVESTMENT', label: 'Net Investment Hedge' },
] as const;

export function DesignateHedgeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(DesignateHedgeInputSchema),
    defaultValues: {
      name: '',
      hedgeType: 'CASH_FLOW',
      hedgedItemId: '',
      hedgingInstrumentId: '',
      hedgeRatio: 1,
      hedgedRisk: '',
      designationDate: new Date(),
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await designateHedgeAction(values);
      if (result.ok) {
        setFeedback({ ok: true, id: result.id });
        router.push(routes.finance.hedgeDetail(result.id));
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
        {/* Name */}
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="name">Relationship Name</Label>
          <Input id="name" {...form.register('name')} placeholder="e.g. USD/EUR Cash Flow Hedge" />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Hedge Type */}
        <div className="space-y-2">
          <Label htmlFor="hedgeType">Hedge Type</Label>
          <Select
            value={form.watch('hedgeType')}
            onValueChange={(v) => form.setValue('hedgeType', v as FormValues['hedgeType'])}
          >
            <SelectTrigger id="hedgeType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {hedgeTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hedge Ratio */}
        <div className="space-y-2">
          <Label htmlFor="hedgeRatio">Hedge Ratio</Label>
          <Input
            id="hedgeRatio"
            type="number"
            step="0.01"
            {...form.register('hedgeRatio', { valueAsNumber: true })}
          />
        </div>

        {/* Hedged Item ID */}
        <div className="space-y-2">
          <Label htmlFor="hedgedItemId">Hedged Item ID</Label>
          <Input id="hedgedItemId" {...form.register('hedgedItemId')} placeholder="Select hedged item" />
          {form.formState.errors.hedgedItemId && (
            <p className="text-sm text-destructive">{form.formState.errors.hedgedItemId.message}</p>
          )}
        </div>

        {/* Hedging Instrument ID */}
        <div className="space-y-2">
          <Label htmlFor="hedgingInstrumentId">Hedging Instrument ID</Label>
          <Input id="hedgingInstrumentId" {...form.register('hedgingInstrumentId')} placeholder="Select hedging instrument" />
          {form.formState.errors.hedgingInstrumentId && (
            <p className="text-sm text-destructive">{form.formState.errors.hedgingInstrumentId.message}</p>
          )}
        </div>

        {/* Hedged Risk */}
        <div className="space-y-2">
          <Label htmlFor="hedgedRisk">Hedged Risk</Label>
          <Input id="hedgedRisk" {...form.register('hedgedRisk')} placeholder="e.g. FX risk, interest rate risk" />
          {form.formState.errors.hedgedRisk && (
            <p className="text-sm text-destructive">{form.formState.errors.hedgedRisk.message}</p>
          )}
        </div>

        {/* Designation Date */}
        <div className="space-y-2">
          <Label htmlFor="designationDate">Designation Date</Label>
          <Input id="designationDate" type="date" {...form.register('designationDate', { valueAsDate: true })} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Designating…' : 'Designate Hedge'}
        </Button>
      </div>
    </form>
  );
}
