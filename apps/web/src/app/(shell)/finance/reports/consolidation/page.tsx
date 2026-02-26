import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReportWrapper, DrilldownRow } from '@/components/erp/report-wrapper';
import { ReportPeriodPicker } from '@/components/erp/report-period-picker';
import { formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';

interface EntityConsolidation {
  entityCode: string;
  entityId: string;
  entityName: string;
  currency: string;
  localRevenue: number;
  localProfit: number;
  fxRate: number;
  reportingRevenue: number;
  reportingProfit: number;
  eliminations: number;
  consolidatedProfit: number;
}

interface ConsolidationTotals {
  localRevenue: number;
  localProfit: number;
  reportingRevenue: number;
  reportingProfit: number;
  eliminations: number;
  consolidatedProfit: number;
}

async function getConsolidationData(): Promise<{
  entities: EntityConsolidation[];
  totals: ConsolidationTotals;
  reportingCurrency: string;
}> {
  await new Promise((r) => setTimeout(r, 400));
  const entities: EntityConsolidation[] = [
    {
      entityCode: 'US-OP',
      entityId: 'ent-1',
      entityName: 'US Operations Inc.',
      currency: 'USD',
      localRevenue: 25000000,
      localProfit: 4500000,
      fxRate: 1.0,
      reportingRevenue: 25000000,
      reportingProfit: 4500000,
      eliminations: -1200000,
      consolidatedProfit: 3300000,
    },
    {
      entityCode: 'EU-OP',
      entityId: 'ent-2',
      entityName: 'European Operations GmbH',
      currency: 'EUR',
      localRevenue: 15000000,
      localProfit: 2250000,
      fxRate: 1.08,
      reportingRevenue: 16200000,
      reportingProfit: 2430000,
      eliminations: -350000,
      consolidatedProfit: 2080000,
    },
    {
      entityCode: 'ASIA-JV',
      entityId: 'ent-3',
      entityName: 'Asia Pacific JV (50%)',
      currency: 'SGD',
      localRevenue: 8000000,
      localProfit: 1200000,
      fxRate: 0.74,
      reportingRevenue: 2960000,
      reportingProfit: 444000,
      eliminations: 0,
      consolidatedProfit: 444000,
    },
  ];
  const totals: ConsolidationTotals = {
    localRevenue: 0,
    localProfit: 0,
    reportingRevenue: entities.reduce((acc, e) => acc + e.reportingRevenue, 0),
    reportingProfit: entities.reduce((acc, e) => acc + e.reportingProfit, 0),
    eliminations: entities.reduce((acc, e) => acc + e.eliminations, 0),
    consolidatedProfit: entities.reduce((acc, e) => acc + e.consolidatedProfit, 0),
  };
  return { entities, totals, reportingCurrency: 'USD' };
}

async function ConsolidationTable() {
  const data = await getConsolidationData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidation Summary by Entity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Entity</th>
                <th className="text-right py-3 px-2 font-semibold">Local Revenue</th>
                <th className="text-right py-3 px-2 font-semibold">Local Profit</th>
                <th className="text-center py-3 px-2 font-semibold">FX Rate</th>
                <th className="text-right py-3 px-2 font-semibold">Reporting Revenue</th>
                <th className="text-right py-3 px-2 font-semibold">Reporting Profit</th>
                <th className="text-right py-3 px-2 font-semibold">Eliminations</th>
                <th className="text-right py-3 px-2 font-semibold">Consolidated</th>
                <th className="w-8" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {data.entities.map((e) => (
                <DrilldownRow key={e.entityId} href={routes.finance.groupEntityDetail(e.entityId)}>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {e.entityCode}
                      </Badge>
                      <span>{e.entityName}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                    {formatCurrency(e.localRevenue, e.currency)}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                    {formatCurrency(e.localProfit, e.currency)}
                  </td>
                  <td className="text-center py-3 px-2 font-mono">{e.fxRate.toFixed(4)}</td>
                  <td className="text-right py-3 px-2 font-mono">
                    {formatCurrency(e.reportingRevenue, data.reportingCurrency)}
                  </td>
                  <td className="text-right py-3 px-2 font-mono">
                    {formatCurrency(e.reportingProfit, data.reportingCurrency)}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-red-600">
                    {e.eliminations !== 0
                      ? formatCurrency(e.eliminations, data.reportingCurrency)
                      : '—'}
                  </td>
                  <td className="text-right py-3 px-2 font-mono font-semibold">
                    {formatCurrency(e.consolidatedProfit, data.reportingCurrency)}
                  </td>
                </DrilldownRow>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted/50">
                <td className="py-3 px-2">Group Total</td>
                <td colSpan={3} className="py-3 px-2"></td>
                <td className="text-right py-3 px-2 font-mono">
                  {formatCurrency(data.totals.reportingRevenue, data.reportingCurrency)}
                </td>
                <td className="text-right py-3 px-2 font-mono">
                  {formatCurrency(data.totals.reportingProfit, data.reportingCurrency)}
                </td>
                <td className="text-right py-3 px-2 font-mono">
                  {formatCurrency(data.totals.eliminations, data.reportingCurrency)}
                </td>
                <td className="text-right py-3 px-2 font-mono">
                  {formatCurrency(data.totals.consolidatedProfit, data.reportingCurrency)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConsolidationReportPage() {
  return (
    <ReportWrapper
      title="Group Consolidation Report"
      description="Consolidated financial results by entity"
      reportId="consolidation"
    >
      <div className="space-y-6">
        <ReportPeriodPicker mode="period" />
        <Suspense fallback={<Skeleton className="h-[400px]" />}>
          <ConsolidationTable />
        </Suspense>
      </div>
    </ReportWrapper>
  );
}
