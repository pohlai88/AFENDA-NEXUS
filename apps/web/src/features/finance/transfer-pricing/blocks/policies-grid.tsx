'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  policyStatusConfig,
  transactionTypeLabels,
  pricingMethodLabels,
} from '../types';
import type { TransferPricingPolicyView as TransferPricingPolicy } from '../queries/transfer-pricing.queries';
import type { PolicyStatus, TransactionType, PricingMethod } from '../types';
import { routes } from '@/lib/constants';

interface PoliciesGridProps {
  policies: TransferPricingPolicy[];
}

function PolicyCard({ policy }: { policy: TransferPricingPolicy }) {
  const config = policyStatusConfig[policy.status as PolicyStatus];
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm text-muted-foreground">{policy.policyNumber}</div>
            <div className="font-medium">{policy.name}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{transactionTypeLabels[policy.transactionType as TransactionType]}</Badge>
              <Badge variant="outline">{pricingMethodLabels[policy.pricingMethod as PricingMethod]}</Badge>
            </div>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Entities:</span>{' '}
            {policy.entityNames.join(' ↔ ')}
          </div>
          <div className="flex justify-between">
            <span>
              <span className="text-muted-foreground">Arm&apos;s Length:</span>{' '}
              {policy.armLengthRange.min}% - {policy.armLengthRange.max}%
            </span>
            <span>
              <span className="text-muted-foreground">Target:</span> {policy.targetMargin}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Next Review: {policy.nextReviewDate ? formatDate(policy.nextReviewDate) : '—'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PoliciesGrid({ policies }: PoliciesGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {policies.map((p) => (
        <Link key={p.id} href={routes.finance.transferPricingDetail(p.id)}>
          <PolicyCard policy={p} />
        </Link>
      ))}
    </div>
  );
}
