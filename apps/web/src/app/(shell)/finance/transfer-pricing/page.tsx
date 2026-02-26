import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Plus, ArrowLeftRight, FileCheck, CheckCircle2 } from 'lucide-react';
import { getTransferPricingPolicies, getTransferPricingSummary } from '@/features/finance/transfer-pricing/queries/transfer-pricing.queries';
import { formatDate } from '@/lib/utils';
import { policyStatusConfig, transactionTypeLabels, pricingMethodLabels } from '@/features/finance/transfer-pricing/types';
import type { TransferPricingPolicy } from '@/features/finance/transfer-pricing/types';

async function SummarySection() {
  const result = await getTransferPricingSummary();
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  const s = result.data;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Policies</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.activePolicies}</div><p className="text-xs text-muted-foreground">of {s.totalPolicies} total</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">IC Transactions YTD</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.transactionsYTD}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Adjustments YTD</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${(s.adjustmentsYTD / 1000).toFixed(0)}K</div></CardContent></Card>
      <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-muted-foreground">Compliance Rate</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{s.complianceRate}%</div><Progress value={s.complianceRate} className="mt-2 h-2" /></CardContent></Card>
    </div>
  );
}

function PolicyCard({ policy }: { policy: TransferPricingPolicy }) {
  const config = policyStatusConfig[policy.status];
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm text-muted-foreground">{policy.policyNumber}</div>
            <div className="font-medium">{policy.name}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{transactionTypeLabels[policy.transactionType]}</Badge>
              <Badge variant="outline">{pricingMethodLabels[policy.pricingMethod]}</Badge>
            </div>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div><span className="text-muted-foreground">Entities:</span> {policy.entityNames.join(' ↔ ')}</div>
          <div className="flex justify-between">
            <span><span className="text-muted-foreground">Arm's Length:</span> {policy.armLengthRange.min}% - {policy.armLengthRange.max}%</span>
            <span><span className="text-muted-foreground">Target:</span> {policy.targetMargin}%</span>
          </div>
          <div className="text-xs text-muted-foreground">Next Review: {policy.nextReviewDate ? formatDate(policy.nextReviewDate) : '—'}</div>
        </div>
      </CardContent>
    </Card>
  );
}

async function PoliciesSection() {
  const result = await getTransferPricingPolicies({ status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {result.data.map((p) => <Link key={p.id} href={`/finance/transfer-pricing/${p.id}`}><PolicyCard policy={p} /></Link>)}
    </div>
  );
}

export default function TransferPricingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ArrowLeftRight className="h-8 w-8" />Transfer Pricing</h1>
          <p className="text-muted-foreground">Intercompany pricing policies and benchmarks</p>
        </div>
        <Button asChild><Link href="/finance/transfer-pricing/new"><Plus className="mr-2 h-4 w-4" />New Policy</Link></Button>
      </div>
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px]" />)}</div>}><SummarySection /></Suspense>
      <h2 className="text-xl font-semibold">Active Policies</h2>
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[200px]" />)}</div>}><PoliciesSection /></Suspense>
    </div>
  );
}
