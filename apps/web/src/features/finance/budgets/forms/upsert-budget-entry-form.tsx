'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpsertBudgetEntrySchema, type UpsertBudgetEntry } from '@afenda/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { upsertBudgetEntryAction } from '../actions/budget.actions';
import type { CommandReceipt } from '@/lib/types';
import { Plus } from 'lucide-react';

interface UpsertBudgetEntryFormProps {
  /** Pre-fill for editing */
  defaultValues?: Partial<UpsertBudgetEntry>;
  onSuccess?: () => void;
}

export function UpsertBudgetEntryForm({
  defaultValues,
  onSuccess,
}: UpsertBudgetEntryFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpsertBudgetEntry>({
    resolver: zodResolver(UpsertBudgetEntrySchema),
    defaultValues: {
      companyId: '',
      ledgerId: '',
      accountId: '',
      periodId: '',
      budgetAmount: 0,
      ...defaultValues,
    },
  });

  async function handleSubmit(data: UpsertBudgetEntry) {
    setSubmitting(true);
    setError(null);

    const result = await upsertBudgetEntryAction(data);

    setSubmitting(false);

    if (result.ok) {
      setReceipt(result.value);
      form.reset();
      router.refresh();
      onSuccess?.();
    } else {
      setError(result.error.message);
    }
  }

  if (receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Budget entry saved"
        onClose={() => setReceipt(null)}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 rounded-md border p-4">
      <h3 className="text-sm font-semibold">
        {defaultValues?.accountId ? 'Edit Budget Entry' : 'Add Budget Entry'}
      </h3>

      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="companyId">Company ID *</Label>
          <Input
            id="companyId"
            placeholder="Select entity"
            {...form.register('companyId')}
          />
          {form.formState.errors.companyId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.companyId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ledgerId">Ledger ID *</Label>
          <Input
            id="ledgerId"
            placeholder="Select entity"
            {...form.register('ledgerId')}
          />
          {form.formState.errors.ledgerId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.ledgerId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="accountId">Account ID *</Label>
          <Input
            id="accountId"
            placeholder="Select entity"
            {...form.register('accountId')}
          />
          {form.formState.errors.accountId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.accountId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="periodId">Period ID *</Label>
          <Input
            id="periodId"
            placeholder="Select entity"
            {...form.register('periodId')}
          />
          {form.formState.errors.periodId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.periodId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="budgetAmount">Amount *</Label>
          <Input
            id="budgetAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...form.register('budgetAmount', { valueAsNumber: true })}
          />
          {form.formState.errors.budgetAmount && (
            <p className="text-xs text-destructive">
              {form.formState.errors.budgetAmount.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" size="sm" disabled={submitting}>
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {submitting ? 'Saving…' : 'Save Entry'}
      </Button>
    </form>
  );
}
