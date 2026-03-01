'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMatchToleranceSchema } from '@afenda/contracts';
import type { CreateMatchTolerance } from '@afenda/contracts';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createMatchToleranceAction } from '../actions/settings.actions';
import type { CommandReceipt } from '@/lib/types';

export function CreateMatchToleranceForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateMatchTolerance>({
    resolver: zodResolver(CreateMatchToleranceSchema),
    defaultValues: { autoHold: true },
  });

  const autoHold = watch('autoHold');

  function onSubmit(data: CreateMatchTolerance) {
    setError(null);
    startTransition(async () => {
      const result = await createMatchToleranceAction(data);
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
        title="Match Tolerance Created"
        receipt={receipt}
        onClose={() => router.push(routes.finance.matchTolerance)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Scope</Label>
          <Select onValueChange={(v) => setValue('scope', v as CreateMatchTolerance['scope'])}>
            <SelectTrigger>
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ORG">Organisation</SelectItem>
              <SelectItem value="COMPANY">Company</SelectItem>
              <SelectItem value="SITE">Site</SelectItem>
            </SelectContent>
          </Select>
          {errors.scope && <p className="text-sm text-destructive">{errors.scope.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="toleranceBps">Tolerance (bps)</Label>
          <Input id="toleranceBps" type="number" {...register('toleranceBps', { valueAsNumber: true })} aria-invalid={!!errors.toleranceBps} />
          {errors.toleranceBps && <p className="text-sm text-destructive">{errors.toleranceBps.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantityTolerancePercent">Qty Tolerance %</Label>
          <Input id="quantityTolerancePercent" type="number" {...register('quantityTolerancePercent', { valueAsNumber: true })} aria-invalid={!!errors.quantityTolerancePercent} />
          {errors.quantityTolerancePercent && <p className="text-sm text-destructive">{errors.quantityTolerancePercent.message}</p>}
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch id="autoHold" checked={autoHold} onCheckedChange={(v) => setValue('autoHold', v)} />
          <Label htmlFor="autoHold">Auto-hold on mismatch</Label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create Tolerance'}
      </Button>
    </form>
  );
}
