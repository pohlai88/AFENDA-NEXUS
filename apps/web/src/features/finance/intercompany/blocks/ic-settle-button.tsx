'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { settleIcTransactionAction } from '../actions/ic.actions';
import type { CommandReceipt } from '@/lib/types';
import { Handshake } from 'lucide-react';

interface IcSettleButtonProps {
  transactionId: string;
  sourceCompanyId: string;
  mirrorCompanyId: string;
  amount: string;
  currency: string;
  disabled?: boolean;
}

export function IcSettleButton({
  transactionId,
  sourceCompanyId,
  mirrorCompanyId,
  amount,
  currency,
  disabled,
}: IcSettleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'NETTING' | 'CASH' | 'JOURNAL'>('NETTING');
  const [reason, setReason] = useState('');

  function handleSettle() {
    startTransition(async () => {
      setError(null);
      const result = await settleIcTransactionAction(transactionId, {
        sellerCompanyId: sourceCompanyId,
        buyerCompanyId: mirrorCompanyId,
        documentIds: [transactionId],
        settlementMethod: method,
        settlementAmount: amount,
        currency,
        fxGainLoss: '0',
        reason: reason || undefined,
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
        title="IC transaction settled"
        onClose={() => setReceipt(null)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" disabled={disabled}>
          <Handshake className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Settle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle IC Transaction</DialogTitle>
          <DialogDescription>
            Settle this intercompany transaction for {currency} {amount}.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Settlement Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NETTING">Netting</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="JOURNAL">Journal Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settleReason">Reason (optional)</Label>
            <Input
              id="settleReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Settlement reason"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSettle} disabled={isPending}>
            {isPending ? 'Settling...' : 'Confirm Settlement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
