'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Play, RotateCcw, XCircle } from 'lucide-react';
import {
  executePaymentRunAction,
  reversePaymentRunAction,
} from '../actions/ap-payment-run.actions';
import type { PaymentRunStatus } from '@afenda/contracts';
import { routes } from '@/lib/constants';

interface ApPaymentRunActionsProps {
  runId: string;
  status: PaymentRunStatus;
}

export function ApPaymentRunActions({ runId, status }: ApPaymentRunActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState('');

  function handleExecute() {
    setError(null);
    startTransition(async () => {
      const result = await executePaymentRunAction(runId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleReverse() {
    if (!reverseReason.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await reversePaymentRunAction(runId, reverseReason.trim());
      if (result.ok) {
        setReverseDialogOpen(false);
        setReverseReason('');
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && (
        <p className="w-full text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {status === 'DRAFT' && (
        <Button asChild variant="outline" size="sm">
          <a href={routes.finance.paymentRunItems(runId)}>Add Items</a>
        </Button>
      )}

      {(status === 'DRAFT' || status === 'APPROVED') && (
        <Button size="sm" onClick={handleExecute} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Execute
        </Button>
      )}

      {status === 'EXECUTED' && (
        <>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setReverseDialogOpen(true)}
            disabled={isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reverse
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={routes.finance.paymentRunRemittance(runId)}>View Remittance</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={routes.finance.paymentRunRejection(runId)}>
              <XCircle className="mr-2 h-4 w-4" />
              Bank Rejection
            </a>
          </Button>
        </>
      )}

      {/* Reverse dialog */}
      <Dialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse Payment Run</DialogTitle>
            <DialogDescription>
              This will reverse all payments and reopen the associated invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reverse-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reverse-reason"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Reason for reversal"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReverseDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReverse}
              disabled={isPending || !reverseReason.trim()}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reversal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
