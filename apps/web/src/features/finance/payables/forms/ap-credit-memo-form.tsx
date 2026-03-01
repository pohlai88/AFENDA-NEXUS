'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCreditMemoSchema, type CreateCreditMemo } from '@afenda/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';

interface ApCreditMemoFormProps {
  onSubmit: (data: CreateCreditMemo) => Promise<ApiResult<CommandReceipt>>;
}

export function ApCreditMemoForm({ onSubmit }: ApCreditMemoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { isOpen, receipt, showReceipt, clearReceipt } = useReceipt();

  const form = useForm<CreateCreditMemo>({
    resolver: zodResolver(CreateCreditMemoSchema),
    defaultValues: {
      originalInvoiceId: '',
      reason: '',
    },
  });

  function handleSubmit(data: CreateCreditMemo) {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(data);
      if (result.ok) {
        showReceipt(result.value);
      } else {
        setError(result.error.message);
      }
    });
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Credit Memo Created"
        onClose={clearReceipt}
        viewHref={routes.finance.payableDetail(receipt.resultRef)}
        backHref={routes.finance.payables}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="originalInvoiceId">
          Original Invoice ID <span className="text-destructive">*</span>
        </Label>
        <Input
          id="originalInvoiceId"
          {...form.register('originalInvoiceId')}
          placeholder="Select the original invoice to credit"
          className="font-mono text-sm"
        />
        {form.formState.errors.originalInvoiceId && (
          <p className="text-xs text-destructive">{form.formState.errors.originalInvoiceId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">
          Reason <span className="text-destructive">*</span>
        </Label>
        <Textarea id="reason" {...form.register('reason')} placeholder="Reason for the credit memo" rows={3} />
        {form.formState.errors.reason && (
          <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Credit Memo
        </Button>
      </div>
    </form>
  );
}
