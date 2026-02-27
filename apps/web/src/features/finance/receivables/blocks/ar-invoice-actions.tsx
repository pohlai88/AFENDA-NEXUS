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
  approveArInvoiceAction,
  postArInvoiceAction,
  cancelArInvoiceAction,
  writeOffArInvoiceAction,
} from '../actions/ar.actions';
import type { ArInvoiceStatus } from '@afenda/contracts';
import { CheckCircle, Send, XCircle, DollarSign, FileX } from 'lucide-react';
import Link from 'next/link';

interface ArInvoiceActionsProps {
  invoiceId: string;
  status: ArInvoiceStatus;
}

export function ArInvoiceActions({ invoiceId, status }: ArInvoiceActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  // ─── Reason Dialog State ────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'cancel' | 'writeOff'>('cancel');
  const [reason, setReason] = useState('');

  // ─── Post Dialog State ──────────────────────────────────────────────
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [fiscalPeriodId, setFiscalPeriodId] = useState('');
  const [arAccountId, setArAccountId] = useState('');

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveArInvoiceAction(invoiceId);
      if (result.ok) {
        showReceipt(result.value);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function handlePostSubmit() {
    if (!fiscalPeriodId.trim() || !arAccountId.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await postArInvoiceAction(
        invoiceId,
        fiscalPeriodId.trim(),
        arAccountId.trim()
      );
      if (result.ok) {
        setPostDialogOpen(false);
        showReceipt(result.value);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function openReasonDialog(mode: 'cancel' | 'writeOff') {
    setDialogMode(mode);
    setReason('');
    setError(null);
    setDialogOpen(true);
  }

  function handleReasonSubmit() {
    if (!reason.trim()) return;
    setError(null);
    startTransition(async () => {
      const action = dialogMode === 'cancel' ? cancelArInvoiceAction : writeOffArInvoiceAction;
      const result = await action(invoiceId, reason.trim());
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
        title="Invoice Updated"
        onClose={() => {
          clearReceipt();
          router.refresh();
        }}
        viewHref={routes.finance.receivableDetail(invoiceId)}
        backHref={routes.finance.receivables}
      />
    );
  }

  const isTerminal = status === 'PAID' || status === 'CANCELLED' || status === 'WRITTEN_OFF';

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
        {/* Approve — DRAFT or PENDING_APPROVAL */}
        {(status === 'DRAFT' || status === 'PENDING_APPROVAL') && (
          <Button
            onClick={handleApprove}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            {isPending ? 'Approving…' : 'Approve'}
          </Button>
        )}

        {/* Post — APPROVED only */}
        {status === 'APPROVED' && (
          <Button
            onClick={() => setPostDialogOpen(true)}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Post to Ledger
          </Button>
        )}

        {/* Allocate Payment — POSTED or PARTIALLY_PAID */}
        {(status === 'POSTED' || status === 'PARTIALLY_PAID') && (
          <Button variant="outline" asChild className="w-full justify-start gap-2" size="sm">
            <Link href={routes.finance.receivableAllocate(invoiceId)}>
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              Allocate Payment
            </Link>
          </Button>
        )}

        {/* Write Off — POSTED or PARTIALLY_PAID */}
        {(status === 'POSTED' || status === 'PARTIALLY_PAID') && (
          <Button
            variant="outline"
            onClick={() => openReasonDialog('writeOff')}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <FileX className="h-4 w-4" aria-hidden="true" />
            Write Off
          </Button>
        )}

        {/* Cancel — only for non-terminal, non-posted statuses */}
        {!isTerminal && status !== 'POSTED' && status !== 'PARTIALLY_PAID' && (
          <Button
            variant="destructive"
            onClick={() => openReasonDialog('cancel')}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Cancel Invoice
          </Button>
        )}

        {isTerminal && (
          <p className="text-xs text-muted-foreground">
            This invoice is <strong>{status.toLowerCase().replace(/_/g, ' ')}</strong> and cannot be
            edited.
          </p>
        )}
      </div>

      {/* Reason Dialog (shared by cancel + write-off) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'cancel' ? 'Cancel Invoice' : 'Write Off Invoice'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'cancel'
                ? 'This will permanently cancel the invoice. This action cannot be undone.'
                : 'This will write off the remaining balance. A write-off journal entry will be created.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ar-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ar-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason…"
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
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Back
            </Button>
            <Button
              type="button"
              variant={dialogMode === 'cancel' ? 'destructive' : 'default'}
              onClick={handleReasonSubmit}
              disabled={isPending || !reason.trim()}
            >
              {isPending
                ? dialogMode === 'cancel'
                  ? 'Cancelling…'
                  : 'Writing Off…'
                : dialogMode === 'cancel'
                  ? 'Confirm Cancel'
                  : 'Confirm Write Off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Dialog (requires fiscal period + AR account) */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Invoice to Ledger</DialogTitle>
            <DialogDescription>
              Select the fiscal period and AR control account for posting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ar-fiscal-period-id">
                Fiscal Period ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ar-fiscal-period-id"
                value={fiscalPeriodId}
                onChange={(e) => setFiscalPeriodId(e.target.value)}
                placeholder="Select fiscal period"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-account-id">
                AR Account ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ar-account-id"
                value={arAccountId}
                onChange={(e) => setArAccountId(e.target.value)}
                placeholder="Select AR control account"
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPostDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePostSubmit}
              disabled={isPending || !fiscalPeriodId.trim() || !arAccountId.trim()}
            >
              {isPending ? 'Posting…' : 'Confirm Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
