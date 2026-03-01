'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/erp/confirm-dialog';
import { toggleAccountActiveAction } from '../actions/account.actions';
import { CheckCircle, XCircle } from 'lucide-react';

interface AccountToggleButtonProps {
  accountId: string;
  accountName: string;
  isActive: boolean;
}

export function AccountToggleButton({
  accountId,
  accountName,
  isActive,
}: AccountToggleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function doToggle() {
    startTransition(async () => {
      const result = await toggleAccountActiveAction(accountId, !isActive);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  const action = isActive ? 'Deactivate' : 'Activate';

  return (
    <>
      {isActive ? (
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => setConfirmOpen(true)}>
          <XCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {isPending ? 'Deactivating…' : 'Deactivate'}
        </Button>
      ) : (
        <Button size="sm" disabled={isPending} onClick={() => setConfirmOpen(true)}>
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {isPending ? 'Activating…' : 'Activate'}
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`${action} Account`}
        description={`${action} account "${accountName}"?`}
        confirmLabel={action}
        destructive={isActive}
        onConfirm={doToggle}
      />
    </>
  );
}
