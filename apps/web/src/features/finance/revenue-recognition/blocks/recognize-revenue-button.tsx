'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import {
  searchFiscalPeriods,
  searchLedgers,
} from '../../payables/actions/entity-search.actions';
import { PostingPreview, type PostingPreviewData } from '@/components/erp/posting-preview';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import {
  previewRevenueRecognitionAction,
  recognizeRevenueAction,
} from '../actions/revenue.actions';
import type { CommandReceipt } from '@/lib/types';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';

interface RecognizeRevenueButtonProps {
  contractId: string;
  contractNumber: string;
  currency: string;
  deferredAmount: string;
  disabled?: boolean;
}

export function RecognizeRevenueButton({
  contractId,
  contractNumber,
  currency,
  deferredAmount,
  disabled,
}: RecognizeRevenueButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<EntityOption | null>(null);
  const [selectedLedger, setSelectedLedger] = useState<EntityOption | null>(null);
  const [previewData, setPreviewData] = useState<PostingPreviewData | null>(null);

  const handlePreview = () => {
    if (!selectedPeriod || !selectedLedger) return;
    setError(null);

    startTransition(async () => {
      const result = await previewRevenueRecognitionAction(
        contractId,
        selectedPeriod.id,
        selectedLedger.id
      );
      if (result.ok) {
        const preview = result.value;
        setPreviewData({
          ledgerName: preview.ledgerName,
          periodName: preview.periodName,
          currency: preview.currency,
          lines: preview.lines.map((l) => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            debit: Number(l.debit),
            credit: Number(l.credit),
            description: l.description,
          })),
          warnings: preview.warnings,
        });
      } else {
        setError(result.error.message);
      }
    });
  };

  const handlePost = async () => {
    const result = await recognizeRevenueAction(contractId, selectedPeriod!.id, selectedLedger!.id);
    if (result.ok) {
      setPreviewData(null);
      setOpen(false);
      setReceipt(result.value);
      router.refresh();
    } else {
      toast.error(result.error.message);
    }
  };

  if (receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Revenue recognized"
        onClose={() => setReceipt(null)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreviewData(null); setError(null); } }}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" disabled={disabled}>
          <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Recognize Revenue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recognize Revenue — {contractNumber}</DialogTitle>
          <DialogDescription>
            Recognize {currency} {deferredAmount} deferred revenue to the income statement.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        {!previewData ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Fiscal Period</Label>
              <EntityCombobox
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                loadOptions={searchFiscalPeriods}
                placeholder="Search open periods…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target Ledger</Label>
              <EntityCombobox
                value={selectedLedger}
                onChange={setSelectedLedger}
                loadOptions={searchLedgers}
                placeholder="Search ledgers…"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!selectedPeriod || !selectedLedger || isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Preview Posting
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <PostingPreview
            data={previewData}
            onConfirm={handlePost}
            title="Revenue Recognition Preview"
            description="Journal entries to recognize deferred revenue as earned revenue."
            confirmLabel="Recognize & Post"
            compact
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
