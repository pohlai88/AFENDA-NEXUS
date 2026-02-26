'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { processTemplateAction, toggleTemplateAction } from '../actions/recurring.actions';
import type { CommandReceipt } from '@/lib/types';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface RecurringTemplateActionsProps {
  templateId: string;
  templateName: string;
  isActive: boolean;
}

export function RecurringTemplateActions({
  templateId,
  templateName,
  isActive,
}: RecurringTemplateActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleProcess() {
    if (!confirm(`Process recurring template "${templateName}"? This will create a journal entry.`))
      return;

    startTransition(async () => {
      setError(null);
      const result = await processTemplateAction(templateId);
      if (result.ok) {
        setReceipt(result.value);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleToggle() {
    const action = isActive ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} template "${templateName}"?`)) return;

    startTransition(async () => {
      setError(null);
      const result = await toggleTemplateAction(templateId, !isActive);
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
        title={`Template "${templateName}" updated`}
        onClose={() => setReceipt(null)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}

      {isActive && (
        <Button variant="outline" size="sm" disabled={isPending} onClick={handleProcess}>
          <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Process
        </Button>
      )}

      <Button variant="ghost" size="sm" disabled={isPending} onClick={handleToggle}>
        {isActive ? (
          <>
            <Pause className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Deactivate
          </>
        ) : (
          <>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Activate
          </>
        )}
      </Button>
    </div>
  );
}
