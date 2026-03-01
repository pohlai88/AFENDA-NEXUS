'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { RunDunningSchema } from '@afenda/contracts';
import type { RunDunning } from '@afenda/contracts';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { runDunningAction } from '../actions/dunning.actions';
import type { CommandReceipt } from '@/lib/types';

export function RunDunningForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RunDunning>({
    resolver: zodResolver(RunDunningSchema),
    defaultValues: {
      runDate: new Date().toISOString().slice(0, 10),
    },
  });

  function onSubmit(data: RunDunning) {
    setError(null);
    startTransition(async () => {
      const result = await runDunningAction(data.runDate);
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
        title="Dunning Run Created"
        receipt={receipt}
        onClose={() => router.push(routes.finance.dunning)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="runDate">Run Date</Label>
        <Input
          id="runDate"
          type="date"
          {...register('runDate')}
          aria-invalid={!!errors.runDate}
        />
        {errors.runDate && (
          <p className="text-sm text-destructive">{errors.runDate.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Running…' : 'Run Dunning Process'}
      </Button>
    </form>
  );
}
