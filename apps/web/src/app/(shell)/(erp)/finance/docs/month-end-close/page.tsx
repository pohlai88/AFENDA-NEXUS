import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Month-End Close Checklist | Finance Docs',
  description: '10-day close timeline with subledger tasks, period-end adjustments, variance analysis, and financial statement preparation checklist.',
};

/**
 * Month-End Close Checklist Documentation
 */
export default function MonthEndClosePage() {
  const diagramCode = `
gantt
    title Month-End Close Timeline (Days 1-10 of Next Month)
    dateFormat YYYY-MM-DD
    axisFormat %d
    
    section Day 1-2
    Bank reconciliation           :a1, 2026-02-01, 1d
    Intercompany reconciliation   :a2, 2026-02-01, 2d
    AP accruals                   :a3, 2026-02-01, 1d
    AR revenue recognition        :a4, 2026-02-01, 2d
    
    section Day 3-5
    Inventory valuation           :b1, 2026-02-03, 2d
    Fixed asset depreciation      :b2, 2026-02-03, 1d
    Payroll accruals              :b3, 2026-02-03, 1d
    Prepaid/deferred amortization :b4, 2026-02-03, 2d
    FX revaluation                :b5, 2026-02-04, 1d
    
    section Day 6-7
    Journal entry review          :c1, 2026-02-05, 2d
    Variance analysis             :c2, 2026-02-06, 2d
    Trial balance review          :c3, 2026-02-06, 1d
    
    section Day 8-10
    Financial statement prep      :d1, 2026-02-07, 2d
    Management reporting          :d2, 2026-02-08, 2d
    Close sign-off                :milestone, 2026-02-10, 0d
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Month-End Close Checklist</CardTitle>
          <CardDescription>
            10-day close timeline with key tasks and dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Close Checklist Details</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Day 1-2: Subledger Close</h3>
          <ul>
            <li>Reconcile all bank accounts to statements</li>
            <li>Clear intercompany balances with subsidiaries</li>
            <li>Record AP accruals for uninvoiced goods/services received</li>
            <li>Review revenue recognition for % completion contracts</li>
          </ul>

          <h3>Day 3-5: Period-End Adjustments</h3>
          <ul>
            <li>Run inventory valuation (FIFO/weighted average)</li>
            <li>Calculate depreciation for new/disposed assets</li>
            <li>Accrue payroll expenses for partial pay periods</li>
            <li>Amortize prepaid expenses and deferred revenue</li>
            <li>Revalue foreign currency balances to period-end rates</li>
          </ul>

          <h3>Day 6-7: Review & Analysis</h3>
          <ul>
            <li>Review all manual journal entries for accuracy</li>
            <li>Perform variance analysis vs budget and prior month</li>
            <li>Balance trial balance (ensure debits = credits)</li>
            <li>Resolve out-of-balance accounts</li>
          </ul>

          <h3>Day 8-10: Reporting & Sign-Off</h3>
          <ul>
            <li>Generate financial statements (P&L, balance sheet, cash flow)</li>
            <li>Prepare management commentary and KPI dashboard</li>
            <li>Controller review and sign-off</li>
            <li>Distribute reports to stakeholders</li>
          </ul>

          <h3>Target: 5-Day Close</h3>
          <p>
            Best-in-class organizations close in 5 days by:
          </p>
          <ul>
            <li>Automating reconciliations (bank, intercompany)</li>
            <li>Pre-posting standard accruals (rent, depreciation)</li>
            <li>Continuous close activities (daily reconciliations)</li>
            <li>Parallel processing (not sequential)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
