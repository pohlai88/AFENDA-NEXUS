'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { routes } from '@/lib/constants';
import { toggleAccountActiveAction } from '../actions/account.actions';
import { CheckCircle, XCircle } from 'lucide-react';

interface AccountActionsProps {
  accountId: string;
  isActive: boolean;
}

export function AccountActions({ accountId, isActive }: AccountActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleAccountActiveAction(accountId, !isActive);
      if (result.ok) {
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
        title={isActive ? 'Account Deactivated' : 'Account Activated'}
        onClose={() => {
          clearReceipt();
          router.refresh();
        }}
        viewHref={routes.finance.accountDetail(accountId)}
        backHref={routes.finance.accounts}
      />
    );
  }

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
        {isActive ? (
          <Button
            variant="destructive"
            onClick={handleToggle}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {isPending ? 'Deactivating…' : 'Deactivate Account'}
          </Button>
        ) : (
          <Button
            onClick={handleToggle}
            disabled={isPending}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            {isPending ? 'Activating…' : 'Activate Account'}
          </Button>
        )}
      </div>
    </div>
  );
}
