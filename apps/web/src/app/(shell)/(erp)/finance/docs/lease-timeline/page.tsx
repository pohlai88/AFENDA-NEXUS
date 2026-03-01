import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lease Portfolio Maturity Timeline | Finance Docs',
  description: 'Lease portfolio documentation with maturity timelines, renewal options, extension periods, and termination dates for real estate, equipment, and vehicle leases.',
};

/**
 * Lease Portfolio Maturity Timeline Documentation
 */
export default function LeaseMaturityTimelinePage() {
  const diagramCode = `
gantt
    title Lease Portfolio Maturity Timeline (Next 5 Years)
    dateFormat YYYY-MM
    axisFormat %Y
    
    section Real Estate
    HQ Office (NYC)          :active, hq1, 2024-01, 2028-12
    Warehouse (NJ)           :active, wh1, 2023-06, 2026-05
    Retail Store (Boston)    :active, rt1, 2025-01, 2030-12
    
    section Equipment
    Production Line A        :active, eq1, 2024-03, 2027-02
    Forklift Fleet           :active, eq2, 2023-09, 2026-08
    IT Servers               :active, eq3, 2025-02, 2028-01
    
    section Vehicles
    Sales Fleet (20 vehicles) :active, vh1, 2024-06, 2027-05
    Executive Cars (5 vehicles) :active, vh2, 2025-03, 2028-02
    
    section Renewal Options
    HQ Office Renewal Option :milestone, 2027-12
    Warehouse Renewal Option :milestone, 2025-11
    Production Line Renewal  :milestone, 2026-08
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lease Portfolio Maturity Timeline</CardTitle>
          <CardDescription>
            Gantt chart showing lease expiration dates and renewal options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lease Portfolio Management</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Lease Categories</h3>
          
          <h4>Real Estate Leases</h4>
          <ul>
            <li><strong>HQ Office (NYC):</strong> 25,000 sq ft, $150/sq ft, expires 2028</li>
            <li><strong>Warehouse (NJ):</strong> 50,000 sq ft, $20/sq ft, expires 2026 (renewal option at 6 months)</li>
            <li><strong>Retail Store (Boston):</strong> 3,000 sq ft, $80/sq ft, expires 2030</li>
          </ul>

          <h4>Equipment Leases</h4>
          <ul>
            <li><strong>Production Line A:</strong> $500K annual, 3-year lease with purchase option at FMV</li>
            <li><strong>Forklift Fleet:</strong> 10 forklifts, $5K/month total, expires 2026</li>
            <li><strong>IT Servers:</strong> $120K annual, 3-year refresh cycle</li>
          </ul>

          <h4>Vehicle Leases</h4>
          <ul>
            <li><strong>Sales Fleet:</strong> 20 vehicles, $600/vehicle/month, 36-month terms</li>
            <li><strong>Executive Cars:</strong> 5 vehicles, $1,200/vehicle/month, 36-month terms</li>
          </ul>

          <h3>ASC 842 / IFRS 16 Treatment</h3>
          <p>
            All leases &gt;12 months capitalized on balance sheet:
          </p>
          <ul>
            <li><strong>ROU (Right-of-Use) Asset:</strong> Present value of lease payments</li>
            <li><strong>Lease Liability:</strong> Matching liability, amortized over lease term</li>
            <li><strong>Short-term exemption:</strong> Leases ≤12 months can expense</li>
            <li><strong>Low-value exemption:</strong> Assets &lt;$5K can expense</li>
          </ul>

          <h3>Renewal Options & Termination Rights</h3>
          
          <h4>Renewal Options</h4>
          <ul>
            <li><strong>HQ Office:</strong> 5-year renewal at 95% of market rate (option exercisable 12 months before expiry)</li>
            <li><strong>Warehouse:</strong> 3-year renewal at fixed $22/sq ft (option at 6 months)</li>
            <li><strong>Production Line:</strong> Month-to-month after initial term at 120% rate</li>
          </ul>

          <h4>Early Termination</h4>
          <ul>
            <li><strong>Retail Store:</strong> Can terminate after 3 years with 6-month notice + penalty of 3 months' rent</li>
            <li><strong>Vehicles:</strong> Early termination allowed with residual value payment</li>
          </ul>

          <h3>Lease Accounting Entries</h3>
          
          <h4>Initial Recognition</h4>
          <pre className="text-xs">
DR ROU Asset           $2,000,000
  CR Lease Liability                $2,000,000
          </pre>

          <h4>Monthly Payment</h4>
          <pre className="text-xs">
DR Lease Liability        $15,000  (principal)
DR Interest Expense        $5,000  (on lease liability)
  CR Cash                            $20,000
          </pre>

          <h4>Monthly Amortization</h4>
          <pre className="text-xs">
DR Amortization Expense   $16,667
  CR Accumulated Amortization        $16,667
          </pre>

          <h3>Portfolio Optimization</h3>
          <p>
            Key decisions based on maturity timeline:
          </p>
          <ul>
            <li><strong>2026 Cluster:</strong> Warehouse + Forklift expire → Negotiate bundled renewal</li>
            <li><strong>2027-2028:</strong> Major renewals (HQ, Production) → Lock in rates 12 months early</li>
            <li><strong>Vehicle Refresh:</strong> Rolling 3-year cycles → Standardize fleet to reduce variety</li>
          </ul>

          <h3>Metrics Tracked</h3>
          <ul>
            <li><strong>Total lease commitment:</strong> Undiscounted future payments</li>
            <li><strong>Weighted average lease term:</strong> Duration of portfolio</li>
            <li><strong>Lease expense as % of revenue:</strong> Benchmark vs industry</li>
            <li><strong>Renewal rate:</strong> % of leases renewed vs terminated</li>
          </ul>

          <h3>Alerts & Workflow</h3>
          <ul>
            <li><strong>18 months before expiry:</strong> Alert to facilities team for renewal decision</li>
            <li><strong>12 months before:</strong> Market rate analysis and budget approval</li>
            <li><strong>6 months before:</strong> Exercise renewal option or begin exit planning</li>
            <li><strong>3 months before:</strong> Final negotiations and contract execution</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
