import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportWrapper } from '@/components/erp/report-wrapper';
import { ReportPeriodPicker } from '@/components/erp/report-period-picker';
import { formatCurrency } from '@/lib/utils';

interface EquityMovement {
  component: string;
  openingBalance: number;
  comprehensiveIncome: number;
  dividends: number;
  shareIssues: number;
  treasuryShares: number;
  otherMovements: number;
  closingBalance: number;
}

async function getEquityStatementData(): Promise<{ movements: EquityMovement[]; currency: string }> {
  await new Promise((r) => setTimeout(r, 400));
  return {
    currency: 'USD',
    movements: [
      { component: 'Share Capital', openingBalance: 10000000, comprehensiveIncome: 0, dividends: 0, shareIssues: 500000, treasuryShares: 0, otherMovements: 0, closingBalance: 10500000 },
      { component: 'Share Premium', openingBalance: 25000000, comprehensiveIncome: 0, dividends: 0, shareIssues: 1500000, treasuryShares: 0, otherMovements: 0, closingBalance: 26500000 },
      { component: 'Retained Earnings', openingBalance: 45000000, comprehensiveIncome: 8500000, dividends: -3000000, shareIssues: 0, treasuryShares: 0, otherMovements: 0, closingBalance: 50500000 },
      { component: 'OCI - FX Translation', openingBalance: -1200000, comprehensiveIncome: -350000, dividends: 0, shareIssues: 0, treasuryShares: 0, otherMovements: 0, closingBalance: -1550000 },
      { component: 'OCI - Cash Flow Hedges', openingBalance: 185000, comprehensiveIncome: 45000, dividends: 0, shareIssues: 0, treasuryShares: 0, otherMovements: -25000, closingBalance: 205000 },
      { component: 'Treasury Shares', openingBalance: -2500000, comprehensiveIncome: 0, dividends: 0, shareIssues: 0, treasuryShares: -500000, otherMovements: 0, closingBalance: -3000000 },
    ],
  };
}

async function EquityTable() {
  const data = await getEquityStatementData();
  const totals = data.movements.reduce((acc, m) => ({
    openingBalance: acc.openingBalance + m.openingBalance,
    comprehensiveIncome: acc.comprehensiveIncome + m.comprehensiveIncome,
    dividends: acc.dividends + m.dividends,
    shareIssues: acc.shareIssues + m.shareIssues,
    treasuryShares: acc.treasuryShares + m.treasuryShares,
    otherMovements: acc.otherMovements + m.otherMovements,
    closingBalance: acc.closingBalance + m.closingBalance,
  }), { openingBalance: 0, comprehensiveIncome: 0, dividends: 0, shareIssues: 0, treasuryShares: 0, otherMovements: 0, closingBalance: 0 });

  return (
    <Card>
      <CardHeader><CardTitle>Statement of Changes in Equity</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Component</th>
                <th className="text-right py-3 px-2 font-semibold">Opening</th>
                <th className="text-right py-3 px-2 font-semibold">Comprehensive Income</th>
                <th className="text-right py-3 px-2 font-semibold">Dividends</th>
                <th className="text-right py-3 px-2 font-semibold">Share Issues</th>
                <th className="text-right py-3 px-2 font-semibold">Treasury</th>
                <th className="text-right py-3 px-2 font-semibold">Other</th>
                <th className="text-right py-3 px-2 font-semibold">Closing</th>
              </tr>
            </thead>
            <tbody>
              {data.movements.map((m) => (
                <tr key={m.component} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-2">{m.component}</td>
                  <td className="text-right py-3 px-2 font-mono">{formatCurrency(m.openingBalance, data.currency)}</td>
                  <td className="text-right py-3 px-2 font-mono">{m.comprehensiveIncome !== 0 ? formatCurrency(m.comprehensiveIncome, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono">{m.dividends !== 0 ? formatCurrency(m.dividends, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono">{m.shareIssues !== 0 ? formatCurrency(m.shareIssues, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono">{m.treasuryShares !== 0 ? formatCurrency(m.treasuryShares, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono">{m.otherMovements !== 0 ? formatCurrency(m.otherMovements, data.currency) : '—'}</td>
                  <td className="text-right py-3 px-2 font-mono font-semibold">{formatCurrency(m.closingBalance, data.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted/50">
                <td className="py-3 px-2">Total Equity</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(totals.openingBalance, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(totals.comprehensiveIncome, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(totals.dividends, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(totals.shareIssues, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(totals.treasuryShares, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(totals.otherMovements, data.currency)}</td>
                <td className="text-right py-3 px-2 font-mono">{formatCurrency(totals.closingBalance, data.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EquityStatementPage() {
  return (
    <ReportWrapper
      title="Statement of Changes in Equity"
      description="Movements in equity components for the reporting period"
      reportId="equity-statement"
    >
      <div className="space-y-6">
        <ReportPeriodPicker mode="period" />
        <Suspense fallback={<Skeleton className="h-[400px]" />}>
          <EquityTable />
        </Suspense>
      </div>
    </ReportWrapper>
  );
}
