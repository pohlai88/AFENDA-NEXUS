import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, TrendingUp, Wallet, BarChart3 } from 'lucide-react';
import { getInstruments, getInstrumentSummary } from '@/features/finance/instruments/queries/instruments.queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import { instrumentStatusConfig, instrumentCategoryLabels, instrumentTypeLabels, fairValueLevelLabels } from '@/features/finance/instruments/types';
import type { FinancialInstrument } from '@/features/finance/instruments/types';

async function SummarySection() {
  const result = await getInstrumentSummary();
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  const s = result.data;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Instruments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalInstruments}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Carrying Amount</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(s.totalCarryingAmount, 'USD')}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Fair Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(s.totalFairValue, 'USD')}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unrealized G/L</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(s.unrealizedGainLoss, 'USD')}</div></CardContent></Card>
    </div>
  );
}

function InstrumentCard({ instrument }: { instrument: FinancialInstrument }) {
  const config = instrumentStatusConfig[instrument.status];
  const gainLossColor = instrument.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600';
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm text-muted-foreground">{instrument.instrumentNumber}</div>
            <div className="font-medium">{instrument.name}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{instrumentTypeLabels[instrument.type]}</Badge>
              <Badge variant="outline">{instrumentCategoryLabels[instrument.category]}</Badge>
            </div>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Fair Value</span><div className="font-mono font-medium">{formatCurrency(instrument.fairValue, instrument.currency)}</div><div className="text-xs text-muted-foreground">{fairValueLevelLabels[instrument.fairValueLevel]}</div></div>
          <div><span className="text-muted-foreground">Unrealized G/L</span><div className={`font-mono ${gainLossColor}`}>{formatCurrency(instrument.unrealizedGainLoss, instrument.currency)}</div></div>
          <div><span className="text-muted-foreground">Last Valued</span><div>{formatDate(instrument.lastValuationDate)}</div></div>
        </div>
      </CardContent>
    </Card>
  );
}

async function InstrumentsSection() {
  const result = await getInstruments({ status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {result.data.map((i) => <Link key={i.id} href={`/finance/instruments/${i.id}`}><InstrumentCard instrument={i} /></Link>)}
    </div>
  );
}

export default function InstrumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="h-8 w-8" />Financial Instruments (IFRS 9)</h1>
          <p className="text-muted-foreground">Instrument register and fair value measurements</p>
        </div>
        <Button asChild><Link href="/finance/instruments/new"><Plus className="mr-2 h-4 w-4" />New Instrument</Link></Button>
      </div>
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px]" />)}</div>}><SummarySection /></Suspense>
      <h2 className="text-xl font-semibold">Active Instruments</h2>
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[200px]" />)}</div>}><InstrumentsSection /></Suspense>
    </div>
  );
}
