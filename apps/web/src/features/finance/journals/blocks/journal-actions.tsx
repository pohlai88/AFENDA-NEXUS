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
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { routes } from '@/lib/constants';
import {
  postJournalAction,
  reverseJournalAction,
  voidJournalAction,
} from '../actions/journal.actions';
import type { JournalStatus } from '@afenda/contracts';
import { CheckCircle, Undo2, XCircle } from 'lucide-react';

interface JournalActionsProps {
  journalId: string;
  status: JournalStatus;
}

export function JournalActions({ journalId, status }: JournalActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  // ─── Reason Dialog State ────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'reverse' | 'void'>('reverse');
  const [reason, setReason] = useState('');

  function handlePost() {
    setError(null);
    const idempotencyKey = crypto.randomUUID();
    startTransition(async () => {
      const result = await postJournalAction(journalId, idempotencyKey);
      if (result.ok) {
        showReceipt(result.value);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function openReasonDialog(mode: 'reverse' | 'void') {
    setDialogMode(mode);
    setReason('');
    setError(null);
    setDialogOpen(true);
  }

  function handleReasonSubmit() {
    if (!reason.trim()) return;
    setError(null);
    startTransition(async () => {
      const action = dialogMode === 'reverse' ? reverseJournalAction : voidJournalAction;
      const result = await action(journalId, reason.trim());
      if (result.ok) {
        setDialogOpen(false);
        showReceipt(result.value);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title={
          dialogMode === 'reverse'
            ? 'Journal Reversed'
            : status === 'DRAFT'
              ? 'Journal Voided'
              : 'Journal Posted'
        }
        onClose={() => {
          clearReceipt();
          router.refresh();
        }}
        viewHref={routes.finance.journalDetail(journalId)}
        backHref={routes.finance.journals}
      />
    );
  }

  const isReadOnly = status === 'POSTED' || status === 'REVERSED' || status === 'VOIDED';

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Actions</h4>

      {error && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Post — only for DRAFT journals */}
        {status === 'DRAFT' && (
          <Button
            onClick={handlePost}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            {isPending ? 'Posting…' : 'Post Journal'}
          </Button>
        )}

        {/* Reverse — only for POSTED journals */}
        {status === 'POSTED' && (
          <Button
            variant="outline"
            onClick={() => openReasonDialog('reverse')}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Reverse
          </Button>
        )}

        {/* Void — only for DRAFT journals */}
        {status === 'DRAFT' && (
          <Button
            variant="destructive"
            onClick={() => openReasonDialog('void')}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Void
          </Button>
        )}

        {isReadOnly && (
          <p className="text-xs text-muted-foreground">
            This journal is <strong>{status.toLowerCase()}</strong> and cannot be edited.
          </p>
        )}
      </div>

      {/* Reason Dialog (shared by reverse + void) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'reverse' ? 'Reverse Journal' : 'Void Journal'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'reverse'
                ? 'A reversing journal entry will be created automatically. This action cannot be undone.'
                : 'This will permanently void the journal entry. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this action…"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant={dialogMode === 'void' ? 'destructive' : 'default'}
              onClick={handleReasonSubmit}
              disabled={isPending || !reason.trim()}
            >
              {isPending
                ? dialogMode === 'reverse'
                  ? 'Reversing…'
                  : 'Voiding…'
                : dialogMode === 'reverse'
                  ? 'Confirm Reverse'
                  : 'Confirm Void'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
