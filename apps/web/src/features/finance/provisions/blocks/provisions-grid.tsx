'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { provisionStatusConfig, provisionTypeLabels } from '../types';
import type { ProvisionStatus, ProvisionType } from '../types';
import type { ProvisionView as Provision } from '../queries/provisions.queries';
import { routes } from '@/lib/constants';

interface ProvisionsGridProps {
  provisions: Provision[];
}

function ProvisionCard({ provision }: { provision: Provision }) {
  const config = provisionStatusConfig[provision.status as ProvisionStatus];
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm text-muted-foreground">
              {provision.provisionNumber}
            </div>
            <div className="font-medium">{provision.name}</div>
            <Badge variant="secondary" className="mt-1">
              {provisionTypeLabels[provision.type as ProvisionType]}
            </Badge>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Balance</span>
            <div className="font-mono font-medium">
              {formatCurrency(provision.currentBalance, provision.currency)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Utilized YTD</span>
            <div className="font-mono text-blue-600">
              {formatCurrency(provision.utilizationYTD, provision.currency)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Settlement</span>
            <div>
              {provision.expectedSettlementDate
                ? formatDate(provision.expectedSettlementDate)
                : '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProvisionsGrid({ provisions }: ProvisionsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {provisions.map((p) => (
        <Link key={p.id} href={routes.finance.provisionDetail(p.id)}>
          <ProvisionCard provision={p} />
        </Link>
      ))}
    </div>
  );
}
