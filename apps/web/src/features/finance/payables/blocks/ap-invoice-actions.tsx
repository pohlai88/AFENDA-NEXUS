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
import { useReceipt } from '@/hooks/use-receipt';
import { routes } from '@/lib/constants';
import {
  approveApInvoiceAction,
  previewApPostingAction,
  postApInvoiceAction,
  cancelApInvoiceAction,
} from '../actions/ap.actions';
import {
  markInvoiceIncompleteAction,
  resolveTriageAction,
} from '../actions/ap-triage.actions';
import { PostingPreview, type PostingPreviewData } from '@/components/erp/posting-preview';
import {
  searchFiscalPeriods,
  searchAccounts,
} from '../actions/entity-search.actions';
import type { ApInvoiceStatus } from '@afenda/contracts';
import { CheckCircle, Send, XCircle, DollarSign, AlertCircle, RotateCcw } from 'lucide-react';
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

  // ─── Mark Incomplete Dialog ─────────────────────────────────────────
  const [markIncompleteOpen, setMarkIncompleteOpen] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState('');

  // ─── Resolve Triage Dialog ──────────────────────────────────────────
  const [resolveTriageOpen, setResolveTriageOpen] = useState(false);

  // ─── Post Dialog State ──────────────────────────────────────────────
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<EntityOption | null>(null);
  const [selectedApAccount, setSelectedApAccount] = useState<EntityOption | null>(null);
  const [previewData, setPreviewData] = useState<PostingPreviewData | null>(null);

  const apAccountLoader = useCallback(
    (q: string) => searchAccounts(q),
    []
  );

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

  function handlePreview() {
    if (!selectedPeriod || !selectedApAccount) return;
    setError(null);
    startTransition(async () => {
      const result = await previewApPostingAction(
        invoiceId,
        selectedPeriod.id,
        selectedApAccount.id
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
    if (!selectedPeriod || !selectedApAccount) return;
    setError(null);
    const result = await postApInvoiceAction(
      invoiceId,
      selectedPeriod.id,
      selectedApAccount.id
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

  function handleMarkIncompleteSubmit() {
    if (!incompleteReason.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await markInvoiceIncompleteAction(invoiceId, incompleteReason.trim());
      if (result.ok) {
        setMarkIncompleteOpen(false);
        setIncompleteReason('');
        showReceipt(result.value);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleResolveTriage(targetStatus: 'DRAFT' | 'PENDING_APPROVAL') {
    setError(null);
    startTransition(async () => {
      const result = await resolveTriageAction(invoiceId, targetStatus);
      if (result.ok) {
        setResolveTriageOpen(false);
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
        {/* Resolve Triage — INCOMPLETE → DRAFT or PENDING_APPROVAL */}
        {status === 'INCOMPLETE' && (
          <>
            <Button
              onClick={() => setResolveTriageOpen(true)}
              disabled={isPending}
              className="w-full justify-start gap-2"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Resolve Triage
            </Button>
            <Dialog open={resolveTriageOpen} onOpenChange={setResolveTriageOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resolve Triage</DialogTitle>
                  <DialogDescription>
                    Move this invoice back to Draft or Pending Approval for further processing.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleResolveTriage('DRAFT')}
                    disabled={isPending}
                  >
                    Back to Draft
                  </Button>
                  <Button
                    onClick={() => handleResolveTriage('PENDING_APPROVAL')}
                    disabled={isPending}
                  >
                    Pending Approval
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Approve — DRAFT or PENDING_APPROVAL */}
        {(status === 'DRAFT' || status === 'PENDING_APPROVAL') && (
          <>
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full justify-start gap-2"
              size="sm"
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              {isPending ? 'Approving…' : 'Approve'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIncompleteReason('');
                setError(null);
                setMarkIncompleteOpen(true);
              }}
              disabled={isPending}
              className="w-full justify-start gap-2"
              size="sm"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              Mark Incomplete
            </Button>
          </>
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

      {/* Mark Incomplete Dialog */}
      <Dialog open={markIncompleteOpen} onOpenChange={setMarkIncompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice Incomplete</DialogTitle>
            <DialogDescription>
              Move this invoice to the triage queue. Provide a reason for why it needs review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="incomplete-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="incomplete-reason"
              value={incompleteReason}
              onChange={(e) => setIncompleteReason(e.target.value)}
              placeholder="e.g. Missing PO reference, amount mismatch…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkIncompleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkIncompleteSubmit}
              disabled={isPending || !incompleteReason.trim()}
            >
              {isPending ? 'Moving…' : 'Mark Incomplete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Post Dialog (requires fiscal period + AP account → preview → confirm) */}
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
                : 'Select the fiscal period and AP control account for posting.'}
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
                  label="AP Control Account"
                  value={selectedApAccount}
                  onChange={setSelectedApAccount}
                  loadOptions={apAccountLoader}
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
                  disabled={isPending || !selectedPeriod || !selectedApAccount}
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
                title="AP Invoice Posting Preview"
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
