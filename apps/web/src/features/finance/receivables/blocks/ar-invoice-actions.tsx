'use client';

import { useCallback, useState, useTransition } from 'react';
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
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import { PostingPreview, type PostingPreviewData } from '@/components/erp/posting-preview';
import { useReceipt } from '@/hooks/use-receipt';
import { routes } from '@/lib/constants';
import {
  approveArInvoiceAction,
  previewArPostingAction,
  postArInvoiceAction,
  cancelArInvoiceAction,
  writeOffArInvoiceAction,
} from '../actions/ar.actions';
import {
  searchFiscalPeriods,
  searchAccounts,
} from '../actions/entity-search.actions';
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
  const [selectedPeriod, setSelectedPeriod] = useState<EntityOption | null>(null);
  const [selectedArAccount, setSelectedArAccount] = useState<EntityOption | null>(null);
  const [previewData, setPreviewData] = useState<PostingPreviewData | null>(null);

  const arAccountLoader = useCallback(
    (q: string) => searchAccounts(q),
    []
  );

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

  function handlePreview() {
    if (!selectedPeriod || !selectedArAccount) return;
    setError(null);
    startTransition(async () => {
      const result = await previewArPostingAction(
        invoiceId,
        selectedPeriod.id,
        selectedArAccount.id
      );
      if (result.ok) {
        const d = result.value;
        setPreviewData({
          ledgerName: d.ledgerName,
          periodName: d.periodName,
          currency: d.currency,
          lines: d.lines.map((l) => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            debit: Number(l.debit),
            credit: Number(l.credit),
            description: l.description,
          })),
          warnings: d.warnings,
        });
      } else {
        setError(result.error.message);
      }
    });
  }

  async function handlePostSubmit() {
    if (!selectedPeriod || !selectedArAccount) return;
    setError(null);
    const result = await postArInvoiceAction(
      invoiceId,
      selectedPeriod.id,
      selectedArAccount.id
    );
    if (result.ok) {
      setPostDialogOpen(false);
      setPreviewData(null);
      showReceipt(result.value);
      router.refresh();
    } else {
      setError(result.error.message);
    }
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

      {/* Post Dialog (requires fiscal period + AR account → preview → confirm) */}
      <Dialog
        open={postDialogOpen}
        onOpenChange={(open) => {
          setPostDialogOpen(open);
          if (!open) setPreviewData(null);
        }}
      >
        <DialogContent className={previewData ? 'max-w-2xl' : undefined}>
          <DialogHeader>
            <DialogTitle>Post Invoice to Ledger</DialogTitle>
            <DialogDescription>
              {previewData
                ? 'Review the journal lines that will be created, then confirm.'
                : 'Select the fiscal period and AR control account for posting.'}
            </DialogDescription>
          </DialogHeader>

          {!previewData ? (
            <>
              <div className="space-y-3">
                <EntityCombobox
                  label="Fiscal Period"
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  loadOptions={searchFiscalPeriods}
                  placeholder="Search open periods…"
                />
                <EntityCombobox
                  label="AR Control Account"
                  value={selectedArAccount}
                  onChange={setSelectedArAccount}
                  loadOptions={arAccountLoader}
                  placeholder="Search accounts…"
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
                  onClick={() => setPostDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handlePreview}
                  disabled={isPending || !selectedPeriod || !selectedArAccount}
                >
                  {isPending ? 'Loading Preview…' : 'Preview Posting'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <PostingPreview
                data={previewData}
                onConfirm={handlePostSubmit}
                title="AR Invoice Posting Preview"
                confirmLabel="Post to Ledger"
                compact
              />
              {error && (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewData(null)}
                  disabled={isPending}
                >
                  Back
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
