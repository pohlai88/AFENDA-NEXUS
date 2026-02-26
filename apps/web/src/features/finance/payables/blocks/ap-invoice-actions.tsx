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
  approveApInvoiceAction,
  postApInvoiceAction,
  cancelApInvoiceAction,
} from '../actions/ap.actions';
import type { ApInvoiceStatus } from '@afenda/contracts';
import { CheckCircle, Send, XCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface ApInvoiceActionsProps {
  invoiceId: string;
  status: ApInvoiceStatus;
}

export function ApInvoiceActions({ invoiceId, status }: ApInvoiceActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  // ─── Reason Dialog State ────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  // ─── Post Dialog State ──────────────────────────────────────────────
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [fiscalPeriodId, setFiscalPeriodId] = useState('');
  const [apAccountId, setApAccountId] = useState('');

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveApInvoiceAction(invoiceId);
      if (result.ok) {
        showReceipt(result.value);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function handlePostSubmit() {
    if (!fiscalPeriodId.trim() || !apAccountId.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await postApInvoiceAction(
        invoiceId,
        fiscalPeriodId.trim(),
        apAccountId.trim()
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

  function handleCancelSubmit() {
    if (!reason.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelApInvoiceAction(invoiceId, reason.trim());
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
        viewHref={routes.finance.payableDetail(invoiceId)}
        backHref={routes.finance.payables}
      />
    );
  }

  const isTerminal = status === 'PAID' || status === 'CANCELLED';

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

        {/* Record Payment — POSTED or PARTIALLY_PAID */}
        {(status === 'POSTED' || status === 'PARTIALLY_PAID') && (
          <Button variant="outline" asChild className="w-full justify-start gap-2" size="sm">
            <Link href={routes.finance.payablePay(invoiceId)}>
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              Record Payment
            </Link>
          </Button>
        )}

        {/* Cancel — only for non-terminal statuses */}
        {!isTerminal && status !== 'POSTED' && status !== 'PARTIALLY_PAID' && (
          <Button
            variant="destructive"
            onClick={() => {
              setReason('');
              setError(null);
              setDialogOpen(true);
            }}
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
            This invoice is <strong>{status.toLowerCase().replace('_', ' ')}</strong> and cannot be
            edited.
          </p>
        )}
      </div>

      {/* Cancel Reason Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>
              This will permanently cancel the invoice. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for cancellation…"
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
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={isPending || !reason.trim()}
            >
              {isPending ? 'Cancelling…' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Dialog (requires fiscal period + AP account) */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Invoice to Ledger</DialogTitle>
            <DialogDescription>
              Select the fiscal period and AP control account for posting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="fiscal-period-id">
                Fiscal Period ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fiscal-period-id"
                value={fiscalPeriodId}
                onChange={(e) => setFiscalPeriodId(e.target.value)}
                placeholder="UUID of fiscal period"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-account-id">
                AP Account ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ap-account-id"
                value={apAccountId}
                onChange={(e) => setApAccountId(e.target.value)}
                placeholder="UUID of AP control account"
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
              disabled={isPending || !fiscalPeriodId.trim() || !apAccountId.trim()}
            >
              {isPending ? 'Posting…' : 'Confirm Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
