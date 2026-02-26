'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { closePeriodAction, lockPeriodAction, reopenPeriodAction } from '../actions/period.actions';
import type { CommandReceipt } from '@/lib/types';
import type { PeriodStatus } from '../queries/period.queries';
import { Lock, Unlock, CheckCircle } from 'lucide-react';

interface PeriodActionsProps {
  periodId: string;
  periodName: string;
  status: PeriodStatus;
}

export function PeriodActions({ periodId, periodName, status }: PeriodActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAction(
    action: (
      id: string
    ) => Promise<{ ok: boolean; value?: CommandReceipt; error?: { message: string } }>,
    label: string
  ) {
    if (!confirm(`${label} period "${periodName}"?`)) return;

    startTransition(async () => {
      setError(null);
      const result = await action(periodId);
      if (result.ok && result.value) {
        setReceipt(result.value as CommandReceipt);
        router.refresh();
      } else if (!result.ok && result.error) {
        setError(result.error.message);
      }
    });
  }

  if (receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title={`Period ${periodName} updated`}
        onClose={() => setReceipt(null)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}

      {status === 'OPEN' && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(closePeriodAction, 'Close')}
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Close
        </Button>
      )}

      {status === 'CLOSED' && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleAction(lockPeriodAction, 'Lock')}
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Lock
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => handleAction(reopenPeriodAction, 'Reopen')}
          >
            <Unlock className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Reopen
          </Button>
        </>
      )}

      {status === 'LOCKED' && (
        <span className="text-xs text-muted-foreground">
          <Lock className="mr-1 inline h-3 w-3" aria-hidden="true" />
          Locked
        </span>
      )}
    </div>
  );
}
