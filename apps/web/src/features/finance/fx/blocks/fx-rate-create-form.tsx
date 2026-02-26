'use client';

import { useTransition, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { createFxRateAction } from '../actions/fx.actions';
import type { CommandReceipt } from '@/lib/types';
import { Plus } from 'lucide-react';

export function FxRateCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await createFxRateAction({
        fromCurrency: formData.get('fromCurrency') as string,
        toCurrency: formData.get('toCurrency') as string,
        rate: formData.get('rate') as string,
        effectiveDate: formData.get('effectiveDate') as string,
        source: (formData.get('source') as string) || undefined,
      });
      if (result.ok) {
        setReceipt(result.value);
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  if (receipt) {
    return (
      <ReceiptPanel receipt={receipt} title="FX rate created" onClose={() => setReceipt(null)} />
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Add FX Rate</h3>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="fromCurrency">From</Label>
          <Input
            id="fromCurrency"
            name="fromCurrency"
            placeholder="USD"
            maxLength={3}
            required
            className="uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="toCurrency">To</Label>
          <Input
            id="toCurrency"
            name="toCurrency"
            placeholder="EUR"
            maxLength={3}
            required
            className="uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rate">Rate</Label>
          <Input
            id="rate"
            name="rate"
            placeholder="1.0850"
            required
            type="text"
            inputMode="decimal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effectiveDate">Effective</Label>
          <Input id="effectiveDate" name="effectiveDate" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" placeholder="manual" />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {isPending ? 'Creating…' : 'Create Rate'}
      </Button>
    </form>
  );
}
