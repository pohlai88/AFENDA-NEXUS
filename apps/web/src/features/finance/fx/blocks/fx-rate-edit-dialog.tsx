'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { updateFxRateAction } from '../actions/fx.actions';
import type { CommandReceipt } from '@/lib/types';
import type { FxRateListItem } from '../queries/fx.queries';
import { Pencil } from 'lucide-react';

interface FxRateEditDialogProps {
  rate: FxRateListItem;
}

export function FxRateEditDialog({ rate }: FxRateEditDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [rateValue, setRateValue] = useState(rate.rate);
  const [effectiveDate, setEffectiveDate] = useState(rate.effectiveDate);
  const [expiresAt, setExpiresAt] = useState(rate.expiresAt ?? '');
  const [source, setSource] = useState(rate.source);

  function handleSubmit() {
    startTransition(async () => {
      setError(null);
      const result = await updateFxRateAction(rate.id, {
        rate: rateValue,
        effectiveDate,
        expiresAt: expiresAt || null,
        source,
      });
      if (result.ok) {
        setReceipt(result.value);
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  if (receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title={`FX rate ${rate.fromCurrency}/${rate.toCurrency} updated`}
        onClose={() => setReceipt(null)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) {
        setRateValue(rate.rate);
        setEffectiveDate(rate.effectiveDate);
        setExpiresAt(rate.expiresAt ?? '');
        setSource(rate.source);
        setError(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit FX Rate</DialogTitle>
          <DialogDescription>
            Update the {rate.fromCurrency}/{rate.toCurrency} exchange rate.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="editRate">Rate</Label>
            <Input
              id="editRate"
              value={rateValue}
              onChange={(e) => setRateValue(e.target.value)}
              type="text"
              inputMode="decimal"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editEffectiveDate">Effective Date</Label>
            <Input
              id="editEffectiveDate"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editExpiresAt">Expires At</Label>
            <Input
              id="editExpiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editSource">Source</Label>
            <Input
              id="editSource"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="manual"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
