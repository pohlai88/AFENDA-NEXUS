'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateJournalSchema, type CreateJournal } from '@afenda/contracts';
import { JournalLinesEditor } from '../blocks/journal-lines-editor';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import Link from 'next/link';

interface JournalDraftFormProps {
  onSubmit: (data: CreateJournal) => Promise<ApiResult<CommandReceipt>>;
  defaultLedgerId?: string;
  defaultCompanyId?: string;
}

export function JournalDraftForm({
  onSubmit,
  defaultLedgerId,
  defaultCompanyId,
}: JournalDraftFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  // Idempotency: generate a key per form mount, regenerate on success
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateJournal>({
    resolver: zodResolver(CreateJournalSchema),
    defaultValues: {
      companyId: defaultCompanyId ?? '',
      ledgerId: defaultLedgerId ?? '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      lines: [
        { accountCode: '', debit: 0, credit: 0, currency: 'USD' },
        { accountCode: '', debit: 0, credit: 0, currency: 'USD' },
      ],
    },
  });

  async function handleSubmit(data: CreateJournal) {
    // Client-side balance check before sending
    const totalDebit = data.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = data.lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (totalDebit !== totalCredit) {
      setError('Debits must equal credits before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await onSubmit(data);

    setSubmitting(false);

    if (result.ok) {
      showReceipt(result.value);
      // Reset idempotency key for next submission
      idempotencyKeyRef.current = crypto.randomUUID();
    } else {
      setError(result.error.message);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Journal Created Successfully"
        onClose={clearReceipt}
        viewHref={routes.finance.journalDetail(receipt.resultRef)}
        backHref={routes.finance.journals}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Input
            id="description"
            {...form.register('description')}
            placeholder="Journal description"
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">
            Posting Date <span className="text-destructive">*</span>
          </Label>
          <Input id="date" type="date" {...form.register('date')} />
          {form.formState.errors.date && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.date.message}
            </p>
          )}
        </div>
      </div>

      <JournalLinesEditor form={form} />

      {error && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={routes.finance.journals}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Draft'}
        </Button>
      </div>
    </form>
  );
}
