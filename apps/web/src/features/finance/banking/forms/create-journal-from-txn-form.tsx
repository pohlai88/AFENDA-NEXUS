'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createJournalFromTransaction } from '../actions/banking.actions';
import { Landmark } from 'lucide-react';

const CreateJournalFromTxnSchema = z.object({
  bankTransactionId: z.string().min(1, 'Bank transaction is required'),
  statementId: z.string().min(1, 'Statement is required'),
  debitAccountId: z.string().min(1, 'Debit account is required'),
  creditAccountId: z.string().min(1, 'Credit account is required'),
  description: z.string().optional(),
  reference: z.string().optional(),
});

type CreateJournalFromTxnInput = z.infer<typeof CreateJournalFromTxnSchema>;

interface CreateJournalFromTxnFormProps {
  bankTransactionId: string;
  statementId: string;
  onSuccess?: () => void;
}

export function CreateJournalFromTxnForm({
  bankTransactionId,
  statementId,
  onSuccess,
}: CreateJournalFromTxnFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateJournalFromTxnInput>({
    resolver: zodResolver(CreateJournalFromTxnSchema),
    defaultValues: {
      bankTransactionId,
      statementId,
      debitAccountId: '',
      creditAccountId: '',
      description: '',
      reference: '',
    },
  });

  async function handleSubmit(data: CreateJournalFromTxnInput) {
    setSubmitting(true);
    setError(null);

    const result = await createJournalFromTransaction(data);

    setSubmitting(false);

    if (result.ok) {
      router.refresh();
      onSuccess?.();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Create Journal from Transaction</h3>

      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="debitAccountId">Debit Account *</Label>
          <Input
            id="debitAccountId"
            placeholder="GL account ID"
            {...form.register('debitAccountId')}
          />
          {form.formState.errors.debitAccountId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.debitAccountId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="creditAccountId">Credit Account *</Label>
          <Input
            id="creditAccountId"
            placeholder="GL account ID"
            {...form.register('creditAccountId')}
          />
          {form.formState.errors.creditAccountId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.creditAccountId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Journal entry description"
            {...form.register('description')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            placeholder="Optional reference"
            {...form.register('reference')}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={submitting}>
        <Landmark className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {submitting ? 'Creating…' : 'Create Journal'}
      </Button>
    </form>
  );
}
