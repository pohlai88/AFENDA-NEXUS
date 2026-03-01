'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApplyPrepaymentSchema } from '@afenda/contracts';
import type { ApplyPrepaymentDto } from '@afenda/contracts';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { applyPrepaymentAction } from '../actions/prepayment.actions';
import type { CommandReceipt } from '@/lib/types';

export function ApplyPrepaymentForm({ prepaymentId }: { prepaymentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyPrepaymentDto>({
    resolver: zodResolver(ApplyPrepaymentSchema),
    defaultValues: { prepaymentId },
  });

  function onSubmit(data: ApplyPrepaymentDto) {
    setError(null);
    startTransition(async () => {
      const result = await applyPrepaymentAction(data);
      if (result.ok) {
        setReceipt(result.value);
      } else {
        setError(result.error.message);
      }
    });
  }

  if (receipt) {
    return (
      <ReceiptPanel
        title="Prepayment Applied"
        receipt={receipt}
        onClose={() => router.push(routes.finance.prepayments)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('prepaymentId')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetInvoiceId">Target Invoice ID</Label>
          <Input id="targetInvoiceId" {...register('targetInvoiceId')} aria-invalid={!!errors.targetInvoiceId} />
          {errors.targetInvoiceId && <p className="text-sm text-destructive">{errors.targetInvoiceId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} aria-invalid={!!errors.amount} />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Applying…' : 'Apply Prepayment'}
      </Button>
    </form>
  );
}
