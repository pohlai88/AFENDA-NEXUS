import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consolidation Entity Hierarchy | Finance Docs',
  description: 'Corporate structure documentation with ownership percentages, consolidation methods, intercompany eliminations, and foreign currency translation guidance.',
};

/**
 * Consolidation Entity Hierarchy Documentation
 */
export default function ConsolidationHierarchyPage() {
  const diagramCode = `
graph TD
    PARENT[Parent Corp<br/>USD, US GAAP<br/>100%]
    
    PARENT --> USOPS[US Operations<br/>100% owned]
    PARENT --> EUSUB[EU Subsidiary<br/>80% owned]
    PARENT --> ASIAJV[Asia JV<br/>40% owned]
    
    USOPS --> USMFG[US Manufacturing<br/>100%]
    USOPS --> USSVCS[US Services<br/>100%]
    
    EUSUB --> EUGERM[Germany GmbH<br/>100%]
    EUSUB --> EUFR[France SARL<br/>100%]
    
    EUGERM --> EUPL[Poland Sp. z o.o.<br/>75%]
    
    ASIAJV --> ASIACHINA[China WFOE<br/>50%]
    
    style PARENT fill:#1976d2,color:#fff
    style USOPS fill:#43a047,color:#fff
    style EUSUB fill:#fb8c00,color:#fff
    style ASIAJV fill:#e53935,color:#fff
    style USMFG fill:#66bb6a
    style USSVCS fill:#66bb6a
    style EUGERM fill:#ffa726
    style EUFR fill:#ffa726
    style EUPL fill:#ffb74d
    style ASIACHINA fill:#ef5350
    
    classDef notes fill:#f5f5f5,stroke:#333,stroke-width:2px
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consolidation Entity Hierarchy</CardTitle>
          <CardDescription>
            Corporate structure with ownership percentages and consolidation treatment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consolidation Details</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Consolidation Methods by Ownership</h3>
          
          <h4>Full Consolidation (&gt;50% voting control)</h4>
          <ul>
            <li><strong>Method:</strong> Line-by-line consolidation</li>
            <li><strong>Eliminations:</strong> 100% intercompany transactions and balances</li>
            <li><strong>NCI (Non-Controlling Interest):</strong> If &lt;100% owned, record NCI in equity</li>
            <li><strong>Example:</strong> EU Subsidiary (80% owned) → Full consolidation + 20% NCI</li>
          </ul>

          <h4>Equity Method (20-50% ownership, significant influence)</h4>
          <ul>
            <li><strong>Method:</strong> Record investment at cost + share of earnings/losses</li>
            <li><strong>P&L:</strong> Share of investee income in "Equity in Earnings of Affiliates"</li>
            <li><strong>No line-by-line:</strong> Only investment account on balance sheet</li>
            <li><strong>Example:</strong> Asia JV (40% owned) → Equity method</li>
          </ul>

          <h4>Cost Method (&lt;20% ownership, no significant influence)</h4>
          <ul>
            <li><strong>Method:</strong> Record at cost, recognize dividends as income</li>
            <li><strong>No share of earnings:</strong> Only dividend income</li>
          </ul>

          <h3>Consolidation Adjustments</h3>
          
          <h4>Intercompany Eliminations</h4>
          <ul>
            <li><strong>Sales/COGS:</strong> Eliminate intercompany revenue and expense</li>
            <li><strong>Receivables/Payables:</strong> Eliminate intercompany AR/AP</li>
            <li><strong>Dividends:</strong> Eliminate dividends from sub to parent</li>
            <li><strong>Unrealized profit:</strong> Eliminate profit on inventory still held by group</li>
          </ul>

          <h4>Foreign Currency Translation</h4>
          <ul>
            <li><strong>Functional currency:</strong> Currency of primary economic environment</li>
            <li><strong>Balance sheet:</strong> Translate at period-end rate</li>
            <li><strong>P&L:</strong> Translate at average rate</li>
            <li><strong>CTA:</strong> Cumulative Translation Adjustment in OCI</li>
          </ul>

          <h4>NCI Calculation</h4>
          <p>
            For EU Subsidiary (80% owned):
          </p>
          <ul>
            <li><strong>NCI in equity:</strong> 20% × Sub's net assets</li>
            <li><strong>NCI in income:</strong> 20% × Sub's net income</li>
          </ul>

          <h3>Consolidation Process</h3>
          <ol>
            <li><strong>Translate:</strong> Convert foreign sub financials to reporting currency</li>
            <li><strong>Combine:</strong> Add together all controlled entities line-by-line</li>
            <li><strong>Eliminate:</strong> Remove intercompany transactions and balances</li>
            <li><strong>Adjust:</strong> Record NCI, equity method investments, fair value adjustments</li>
            <li><strong>Report:</strong> Consolidated financial statements</li>
          </ol>

          <h3>Common Issues</h3>
          <ul>
            <li><strong>Different year-ends:</strong> Sub closes Dec 31, parent closes Sep 30 → Lag reporting or force close</li>
            <li><strong>Different accounting policies:</strong> Harmonize before consolidation</li>
            <li><strong>Step acquisitions:</strong> When ownership % changes, remeasure investment</li>
            <li><strong>VIEs (Variable Interest Entities):</strong> Consolidate if primary beneficiary, regardless of ownership %</li>
          </ul>

          <h3>Reporting Packages</h3>
          <p>
            Each subsidiary submits monthly/quarterly reporting package:
          </p>
          <ul>
            <li>Trial balance in local currency</li>
            <li>Intercompany balances schedule</li>
            <li>Translation adjustments</li>
            <li>Elimination entries</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
