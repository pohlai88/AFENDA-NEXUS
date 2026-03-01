'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateICLoanInputSchema } from '@afenda/contracts';
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
import { createICLoanAction } from '../actions/treasury.actions';
import { routes } from '@/lib/constants';

type FormValues = z.infer<typeof CreateICLoanInputSchema>;

const loanTypeOptions = [
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'revolving', label: 'Revolving' },
  { value: 'demand_loan', label: 'Demand Loan' },
  { value: 'subordinated', label: 'Subordinated' },
] as const;

const rateTypeOptions = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'floating', label: 'Floating' },
] as const;

export function CreateICLoanForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateICLoanInputSchema),
    defaultValues: {
      lenderEntityId: '',
      borrowerEntityId: '',
      type: 'term_loan',
      principal: 0,
      currency: 'USD',
      interestRate: 0,
      rateType: 'fixed',
      startDate: new Date(),
      maturityDate: new Date(),
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createICLoanAction(values);
      if (result.ok) {
        setFeedback({ ok: true, id: result.value?.id });
        router.push(routes.finance.icLoanDetail(result.value?.id ?? ''));
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
        <div className="space-y-2">
          <Label htmlFor="lenderEntityId">Lender Entity ID</Label>
          <Input id="lenderEntityId" {...form.register('lenderEntityId')} />
          {form.formState.errors.lenderEntityId && (
            <p className="text-sm text-destructive">{form.formState.errors.lenderEntityId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="borrowerEntityId">Borrower Entity ID</Label>
          <Input id="borrowerEntityId" {...form.register('borrowerEntityId')} />
          {form.formState.errors.borrowerEntityId && (
            <p className="text-sm text-destructive">{form.formState.errors.borrowerEntityId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Loan Type</Label>
          <Select
            value={form.watch('type')}
            onValueChange={(v) => form.setValue('type', v as FormValues['type'])}
          >
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {loanTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="principal">Principal</Label>
          <Input id="principal" type="number" step="0.01" {...form.register('principal', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" {...form.register('currency')} placeholder="USD" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (%)</Label>
          <Input id="interestRate" type="number" step="0.01" {...form.register('interestRate', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rateType">Rate Type</Label>
          <Select
            value={form.watch('rateType')}
            onValueChange={(v) => form.setValue('rateType', v as FormValues['rateType'])}
          >
            <SelectTrigger id="rateType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {rateTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceRate">Reference Rate</Label>
          <Input id="referenceRate" {...form.register('referenceRate')} placeholder="e.g. EURIBOR 3M" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spread">Spread (bps)</Label>
          <Input id="spread" type="number" step="0.01" {...form.register('spread', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" {...form.register('startDate', { valueAsDate: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maturityDate">Maturity Date</Label>
          <Input id="maturityDate" type="date" {...form.register('maturityDate', { valueAsDate: true })} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create IC Loan'}
        </Button>
      </div>
    </form>
  );
}
