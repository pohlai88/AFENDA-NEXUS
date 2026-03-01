'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  recalculateInternalScoreAction,
} from '../actions/credit.actions';
import { routes } from '@/lib/constants';
import type { CustomerCreditView } from '../queries/credit.queries';

interface CreditActionsProps {
  credit: CustomerCreditView;
}

export function CreditActions({ credit }: CreditActionsProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRecalculate() {
    startTransition(async () => {
      const result = await recalculateInternalScoreAction(credit.customerId);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => router.push(routes.finance.creditReviews)}
      >
        View Reviews
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        disabled={pending}
        onClick={handleRecalculate}
      >
        Recalculate Score
      </Button>

      {!credit.isOnHold && (
        <Button
          variant="destructive"
          size="sm"
          className="w-full justify-start"
          onClick={() => router.push(`${routes.finance.creditLimits}?holdCustomer=${credit.customerId}`)}
        >
          Place Hold
        </Button>
      )}
    </div>
  );
}
