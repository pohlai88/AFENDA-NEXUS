import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Scale, AlertTriangle, TrendingDown, TrendingUp, RotateCcw } from 'lucide-react';
import {
  getProvisions,
  getProvisionSummary,
} from '@/features/finance/provisions/queries/provisions.queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import { provisionStatusConfig, provisionTypeLabels } from '@/features/finance/provisions/types';
import type { Provision } from '@/features/finance/provisions/types';
import { routes } from '@/lib/constants';

async function SummarySection() {
  const result = await getProvisionSummary();
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  const s = result.data;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Active Provisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.activeProvisions}</div>
          <p className="text-xs text-muted-foreground">of {s.totalProvisions} total</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(s.totalBalance, 'USD')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Utilization YTD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(s.utilizationYTD, 'USD')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Additions YTD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(s.additionsYTD, 'USD')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProvisionCard({ provision }: { provision: Provision }) {
  const config = provisionStatusConfig[provision.status];
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
              {provisionTypeLabels[provision.type]}
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

async function ProvisionsSection() {
  const result = await getProvisions({ status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {result.data.map((p) => (
        <Link key={p.id} href={routes.finance.provisionDetail(p.id)}>
          <ProvisionCard provision={p} />
        </Link>
      ))}
    </div>
  );
}

export default function ProvisionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="h-8 w-8" />
            Provisions (IAS 37)
          </h1>
          <p className="text-muted-foreground">
            Manage provisions, contingent liabilities, and movements
          </p>
        </div>
        <Button asChild>
          <Link href={routes.finance.provisionNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Provision
          </Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        }
      >
        <SummarySection />
      </Suspense>
      <h2 className="text-xl font-semibold">Active Provisions</h2>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        }
      >
        <ProvisionsSection />
      </Suspense>
    </div>
  );
}
