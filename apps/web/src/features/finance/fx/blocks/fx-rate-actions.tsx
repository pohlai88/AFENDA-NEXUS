'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { approveFxRateAction } from '../actions/fx.actions';
import type { CommandReceipt } from '@/lib/types';
import { CheckCircle } from 'lucide-react';

interface FxRateActionsProps {
  rateId: string;
  displayLabel: string;
}

export function FxRateActions({ rateId, displayLabel }: FxRateActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    if (!confirm(`Approve FX rate "${displayLabel}"?`)) return;

    startTransition(async () => {
      setError(null);
      const result = await approveFxRateAction(rateId);
      if (result.ok) {
        setReceipt(result.value);
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
        title={`FX rate "${displayLabel}" approved`}
        onClose={() => setReceipt(null)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleApprove}>
        <CheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Approve
      </Button>
    </div>
  );
}
