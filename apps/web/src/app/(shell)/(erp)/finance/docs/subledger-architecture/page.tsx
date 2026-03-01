import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subledger Architecture | Finance Docs',
  description: 'General ledger integration architecture showing AR, AP, fixed assets, inventory, and payroll subledger flows with control accounts and reconciliation points.',
};

/**
 * Subledger Architecture Documentation
 */
export default function SubledgerArchitecturePage() {
  const diagramCode = `
graph TB
    subgraph "Operational Systems"
        AR[AR System<br/>Invoices & Receipts]
        AP[AP System<br/>Payables & Payments]
        FA[Fixed Assets<br/>Depreciation]
        INV[Inventory<br/>COGS Valuation]
        PR[Payroll<br/>Compensation]
    end
    
    subgraph "Subledgers"
        ARSUB[AR Subledger<br/>Customer Detail]
        APSUB[AP Subledger<br/>Supplier Detail]
        FASUB[FA Subledger<br/>Asset Detail]
        INVSUB[Inventory Subledger<br/>Item Detail]
        PRSUB[Payroll Subledger<br/>Employee Detail]
    end
    
    subgraph "General Ledger"
        GL[(GL<br/>Chart of Accounts)]
        ARCTL[AR Control]
        APCTL[AP Control]
        FACTL[FA Control]
        INVCTL[Inventory Control]
        PRCTL[Payroll Control]
    end
    
    subgraph "Reconciliation"
        REC[Subledger to GL<br/>Reconciliation]
    end
    
    AR -->|Daily Post| ARSUB
    AP -->|Daily Post| APSUB
    FA -->|Monthly Depreciation| FASUB
    INV -->|Transaction| INVSUB
    PR -->|Pay Run| PRSUB
    
    ARSUB -->|Summary| ARCTL
    APSUB -->|Summary| APCTL
    FASUB -->|Summary| FACTL
    INVSUB -->|Summary| INVCTL
    PRSUB -->|Summary| PRCTL
    
    ARCTL --> GL
    APCTL --> GL
    FACTL --> GL
    INVCTL --> GL
    PRCTL --> GL
    
    ARSUB -->|Detail| REC
    APSUB -->|Detail| REC
    FASUB -->|Detail| REC
    INVSUB -->|Detail| REC
    PRSUB -->|Detail| REC
    
    ARCTL -->|Control Total| REC
    APCTL -->|Control Total| REC
    FACTL -->|Control Total| REC
    INVCTL -->|Control Total| REC
    PRCTL -->|Control Total| REC
    
    style GL fill:#e1f5fe
    style REC fill:#fff9c4
    style ARSUB fill:#f3e5f5
    style APSUB fill:#f3e5f5
    style FASUB fill:#f3e5f5
    style INVSUB fill:#f3e5f5
    style PRSUB fill:#f3e5f5
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subledger Architecture</CardTitle>
          <CardDescription>
            Relationship between operational systems, subledgers, and general ledger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Architecture Details</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Purpose of Subledgers</h3>
          <p>
            Subledgers maintain detailed transactional data while GL holds summarized control totals:
          </p>
          <ul>
            <li><strong>Detail tracking:</strong> Customer/supplier/employee-level transactions</li>
            <li><strong>Audit trail:</strong> Source documents and approval history</li>
            <li><strong>Reporting:</strong> Aging reports, detail listings, activity by entity</li>
          </ul>

          <h3>Key Subledgers</h3>
          
          <h4>1. AR Subledger</h4>
          <ul>
            <li>Customer invoices and credit memos</li>
            <li>Payment applications and adjustments</li>
            <li>Aging by customer</li>
            <li><strong>GL Control:</strong> 1200 Accounts Receivable</li>
          </ul>

          <h4>2. AP Subledger</h4>
          <ul>
            <li>Supplier invoices and debit notes</li>
            <li>Payment history</li>
            <li>Aging by supplier</li>
            <li><strong>GL Control:</strong> 2100 Accounts Payable</li>
          </ul>

          <h4>3. Fixed Assets Subledger</h4>
          <ul>
            <li>Asset acquisition, transfer, disposal</li>
            <li>Depreciation schedules (GAAP, IFRS, Tax)</li>
            <li>Asset register by location/category</li>
            <li><strong>GL Control:</strong> 1500 Fixed Assets (Net), 1550 Accumulated Depreciation</li>
          </ul>

          <h4>4. Inventory Subledger</h4>
          <ul>
            <li>Item receipts and issues</li>
            <li>Valuation (FIFO, weighted average)</li>
            <li>Stock by location/warehouse</li>
            <li><strong>GL Control:</strong> 1400 Inventory</li>
          </ul>

          <h4>5. Payroll Subledger</h4>
          <ul>
            <li>Employee earnings, deductions, taxes</li>
            <li>Benefits accruals</li>
            <li>Pay run history</li>
            <li><strong>GL Control:</strong> 6000 Salaries & Wages, 2300 Payroll Liabilities</li>
          </ul>

          <h3>Reconciliation Process</h3>
          <p>
            <strong>Monthly reconciliation:</strong> Ensure subledger detail totals match GL control accounts
          </p>
          <ol>
            <li>Run subledger aging/trial balance report</li>
            <li>Extract GL control account balance</li>
            <li>Compare totals - should match exactly</li>
            <li>Investigate and resolve variances</li>
          </ol>

          <h3>Common Reconciliation Issues</h3>
          <ul>
            <li>Journal entries posted directly to control accounts (bypass subledger)</li>
            <li>Timing differences (batch not yet posted)</li>
            <li>Currency revaluation in GL but not subledger</li>
            <li>Subledger data deleted/corrupted</li>
          </ul>

          <h3>Best Practices</h3>
          <ul>
            <li><strong>Lock control accounts:</strong> Block manual journals to control accounts</li>
            <li><strong>Daily reconciliation:</strong> For high-volume subledgers (AR, AP)</li>
            <li><strong>Automated checks:</strong> System validations on subledger posts</li>
            <li><strong>Audit trail:</strong> Maintain full history (no deletion of posted transactions)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
