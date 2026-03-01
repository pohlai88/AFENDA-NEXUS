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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { PostingPreview, type PostingPreviewData } from '@/components/erp/posting-preview';
import { settleIcTransactionAction, previewIcTransactionAction } from '../actions/ic.actions';
import type { CommandReceipt } from '@/lib/types';
import { Handshake, Loader2 } from 'lucide-react';

interface IcPreviewSettleButtonProps {
  transactionId: string;
  sourceCompanyId: string;
  sourceCompanyName: string;
  mirrorCompanyId: string;
  mirrorCompanyName: string;
  amount: string;
  currency: string;
  /** Pass the full IC transaction creation body for preview */
  previewBody?: Record<string, unknown>;
  disabled?: boolean;
}

/**
 * IC settlement button with dual-journal PostingPreview (source + mirror).
 * Renders two PostingPreview tabs — one per company entity.
 */
export function IcPreviewSettleButton({
  transactionId,
  sourceCompanyId,
  sourceCompanyName,
  mirrorCompanyId,
  mirrorCompanyName,
  amount,
  currency,
  previewBody,
  disabled,
}: IcPreviewSettleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'NETTING' | 'CASH' | 'JOURNAL'>('NETTING');
  const [reason, setReason] = useState('');

  const [sourcePreview, setSourcePreview] = useState<PostingPreviewData | null>(null);
  const [mirrorPreview, setMirrorPreview] = useState<PostingPreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function mapLines(journal: {
    ledgerName: string;
    periodName: string;
    currency: string;
    lines: Array<{
      accountCode: string;
      accountName: string;
      debit: string;
      credit: string;
      description: string;
    }>;
    warnings: string[];
  }): PostingPreviewData {
    return {
      ledgerName: journal.ledgerName,
      periodName: journal.periodName,
      currency: journal.currency,
      lines: journal.lines.map((l) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: Number(l.debit),
        credit: Number(l.credit),
        description: l.description,
      })),
      warnings: journal.warnings,
    };
  }

  function handlePreview() {
    if (!previewBody) {
      // If no preview body, skip straight to settle
      handleSettle();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await previewIcTransactionAction(previewBody);
      if (result.ok) {
        setSourcePreview(mapLines(result.value.sourceJournal));
        setMirrorPreview(mapLines(result.value.mirrorJournal));
        setShowPreview(true);
      } else {
        setError(result.error.message);
      }
    });
  }

  async function handleSettle() {
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
        setShowPreview(false);
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setShowPreview(false);
          setSourcePreview(null);
          setMirrorPreview(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm" disabled={disabled}>
          <Handshake className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Preview & Settle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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

        {!showPreview ? (
          <>
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
              <Button onClick={handlePreview} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {previewBody ? 'Preview Journals' : 'Confirm Settlement'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="source">
              <TabsList className="w-full">
                <TabsTrigger value="source" className="flex-1">
                  Source — {sourceCompanyName}
                </TabsTrigger>
                <TabsTrigger value="mirror" className="flex-1">
                  Mirror — {mirrorCompanyName}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="source">
                {sourcePreview && (
                  <PostingPreview
                    data={sourcePreview}
                    onConfirm={handleSettle}
                    title={`Source Journal — ${sourceCompanyName}`}
                    confirmLabel="Settle & Post Both Journals"
                    compact
                  />
                )}
              </TabsContent>
              <TabsContent value="mirror">
                {mirrorPreview && (
                  <PostingPreview
                    data={mirrorPreview}
                    onConfirm={handleSettle}
                    title={`Mirror Journal — ${mirrorCompanyName}`}
                    confirmLabel="Settle & Post Both Journals"
                    compact
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
