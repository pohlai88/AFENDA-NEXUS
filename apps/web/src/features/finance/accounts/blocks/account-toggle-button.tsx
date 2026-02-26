'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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

  function handleToggle() {
    const action = isActive ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} account "${accountName}"?`)) return;

    startTransition(async () => {
      const result = await toggleAccountActiveAction(accountId, !isActive);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return isActive ? (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
      <XCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {isPending ? 'Deactivating…' : 'Deactivate'}
    </Button>
  ) : (
    <Button size="sm" disabled={isPending} onClick={handleToggle}>
      <CheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {isPending ? 'Activating…' : 'Activate'}
    </Button>
  );
}
