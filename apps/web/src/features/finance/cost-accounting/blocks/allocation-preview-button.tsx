'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import {
  searchFiscalPeriods,
  searchCostDrivers,
} from '../../payables/actions/entity-search.actions';
import { PostingPreview, type PostingPreviewData } from '@/components/erp/posting-preview';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import {
  previewCostAllocationAction,
  executeAllocationRunAction,
} from '../actions/cost-accounting.actions';
import type { CommandReceipt } from '@/lib/types';
import { toast } from 'sonner';
import { Calculator, Loader2 } from 'lucide-react';

interface AllocationPreviewButtonProps {
  companyId: string;
  currency?: string;
  disabled?: boolean;
}

/**
 * Button that opens a dialog to configure and preview cost allocation GL postings
 * before executing the allocation run.
 */
export function AllocationPreviewButton({
  companyId,
  currency = 'USD',
  disabled,
}: AllocationPreviewButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<EntityOption | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<EntityOption | null>(null);
  const [method, setMethod] = useState<'direct' | 'step_down' | 'reciprocal'>('direct');
  const [previewData, setPreviewData] = useState<PostingPreviewData | null>(null);

  const handlePreview = () => {
    if (!selectedPeriod || !selectedDriver) return;
    setError(null);

    startTransition(async () => {
      const result = await previewCostAllocationAction({
        companyId,
        periodId: selectedPeriod.id,
        method: method.toUpperCase() as 'DIRECT' | 'STEP_DOWN' | 'RECIPROCAL',
        driverId: selectedDriver.id,
        currencyCode: currency,
      });
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

  const handleExecute = async () => {
    if (!selectedPeriod) return;
    const result = await executeAllocationRunAction({
      period: selectedPeriod.id,
      method,
    });
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
        title="Allocation run executed"
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
          setPreviewData(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm" disabled={disabled}>
          <Calculator className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Run Allocation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Execute Cost Allocation</DialogTitle>
          <DialogDescription>
            Configure and preview GL postings for cost allocation before executing.
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
              <Label>Cost Driver</Label>
              <EntityCombobox
                value={selectedDriver}
                onChange={setSelectedDriver}
                loadOptions={searchCostDrivers}
                placeholder="Search cost drivers…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Allocation Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="step_down">Step-Down</SelectItem>
                  <SelectItem value="reciprocal">Reciprocal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!selectedPeriod || !selectedDriver || isPending}
              >
                { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Preview Posting
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <PostingPreview
            data={previewData}
            onConfirm={handleExecute}
            title="Cost Allocation Preview"
            description="The following journal entries will allocate costs from source to target cost centers."
            confirmLabel="Execute Allocation"
            compact
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
