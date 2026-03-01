'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  updateCostCenterStatusAction,
  moveCostCenterAction,
} from '../actions/cost-accounting.actions';
import { Pencil, Archive, RotateCcw, ArrowUpDown } from 'lucide-react';
import { routes } from '@/lib/constants';
import Link from 'next/link';

interface CostCenterActionsProps {
  costCenterId: string;
  status: string;
}

export function CostCenterActions({ costCenterId, status }: CostCenterActionsProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateCostCenterStatusAction(costCenterId, newStatus);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Actions</h3>
      <Separator />

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`${routes.finance.costCenterDetail(costCenterId)}/edit`}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>

        {status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => handleStatusChange('inactive')}
          >
            <Archive className="mr-2 h-3.5 w-3.5" />
            Deactivate
          </Button>
        )}

        {status === 'inactive' && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => handleStatusChange('active')}
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reactivate
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-muted-foreground">Quick Links</h4>
        <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
          <Link href={routes.finance.costCenters}>
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            All Cost Centers
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
          <Link href={routes.finance.costDrivers}>
            Cost Drivers
          </Link>
        </Button>
      </div>
    </div>
  );
}
