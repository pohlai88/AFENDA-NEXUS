import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReportWrapper } from '@/components/erp/report-wrapper';
import { ReportPeriodPicker } from '@/components/erp/report-period-picker';
import { formatCurrency } from '@/lib/utils';

interface TaxSummaryData { outputTax: number; inputTax: number; netPayable: number; withholdingTax: number; corporateTax: number; deferredTax: number; provisions: number; currency: string; period: string; }

async function getTaxSummaryData(): Promise<TaxSummaryData> {
  await new Promise((r) => setTimeout(r, 400));
  return { outputTax: 850000, inputTax: 625000, netPayable: 225000, withholdingTax: 45000, corporateTax: 1250000, deferredTax: 100000, provisions: 85000, currency: 'USD', period: 'Q1 2026' };
}

async function TaxSummaryContent() {
  const data = await getTaxSummaryData();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>VAT/GST Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span>Output Tax (Sales)</span>
            <span className="font-mono font-semibold">{formatCurrency(data.outputTax, data.currency)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Input Tax (Purchases)</span>
            <span className="font-mono font-semibold text-green-600">({formatCurrency(data.inputTax, data.currency)})</span>
          </div>
          <div className="flex justify-between items-center py-2 bg-muted/50 rounded px-2">
            <span className="font-semibold">Net VAT Payable</span>
            <span className="font-mono font-bold text-lg">{formatCurrency(data.netPayable, data.currency)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Withholding Tax</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Total WHT Deducted</span>
            <span className="font-mono font-semibold">{formatCurrency(data.withholdingTax, data.currency)}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <Badge>12 Certificates Issued</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Corporate Income Tax</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span>Current Tax Expense</span>
            <span className="font-mono font-semibold">{formatCurrency(data.corporateTax, data.currency)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Deferred Tax Movement</span>
            <span className="font-mono font-semibold">{formatCurrency(data.deferredTax, data.currency)}</span>
          </div>
          <div className="flex justify-between items-center py-2 bg-muted/50 rounded px-2">
            <span className="font-semibold">Total Tax Expense</span>
            <span className="font-mono font-bold">{formatCurrency(data.corporateTax + data.deferredTax, data.currency)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tax Provisions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Uncertain Tax Positions</span>
            <span className="font-mono font-semibold">{formatCurrency(data.provisions, data.currency)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TaxSummaryPage() {
  return (
    <ReportWrapper title="Tax Summary Report" description="Consolidated view of all tax obligations" reportId="tax-summary">
      <div className="space-y-6">
        <ReportPeriodPicker mode="period" />
        <Suspense fallback={<div className="grid gap-6 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[200px]" />)}</div>}>
          <TaxSummaryContent />
        </Suspense>
      </div>
    </ReportWrapper>
  );
}
