import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Ledger Parallel Accounting | Finance Docs',
  description: 'Parallel ledger architecture for US GAAP, IFRS, tax, and statutory reporting with ledger assignment rules and reconciliation guidance.',
};

/**
 * Multi-Ledger Parallel Accounting Documentation
 */
export default function MultiLedgerAccountingPage() {
  const diagramCode = `
graph LR
    subgraph "Transaction Entry"
        TX[Source Transaction<br/>e.g. Invoice]
    end
    
    subgraph "Ledger Assignment Rules"
        RULE[Ledger Assignment<br/>by Entity/Criteria]
    end
    
    subgraph "Parallel Ledgers"
        GAAP[US GAAP Ledger<br/>Revenue Recognition<br/>ASC 606]
        IFRS[IFRS Ledger<br/>Revenue Recognition<br/>IFRS 15]
        TAX[Tax Ledger<br/>Cash Basis<br/>Depreciation Tables]
        STAT[Statutory Ledger<br/>Local GAAP<br/>Legal Entity]
    end
    
    subgraph "Reporting"
        GAAPRPT[GAAP Reports<br/>US SEC Filing]
        IFRSRPT[IFRS Reports<br/>Consolidated IFRS]
        TAXRPT[Tax Returns<br/>Provisions]
        STATRPT[Statutory Reports<br/>Local Filing]
    end
    
    TX --> RULE
    RULE -->|Accrual| GAAP
    RULE -->|Accrual| IFRS
    RULE -->|Cash/Tax| TAX
    RULE -->|Local Rules| STAT
    
    GAAP --> GAAPRPT
    IFRS --> IFRSRPT
    TAX --> TAXRPT
    STAT --> STATRPT
    
    style TX fill:#e3f2fd
    style GAAP fill:#e8f5e9
    style IFRS fill:#fff3e0
    style TAX fill:#fce4ec
    style STAT fill:#f3e5f5
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Ledger Parallel Accounting</CardTitle>
          <CardDescription>
            Simultaneous accounting under multiple frameworks from a single transaction source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Ledger Details</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Why Multiple Ledgers?</h3>
          <p>
            Organizations need parallel accounting when they must report under different frameworks:
          </p>
          <ul>
            <li><strong>Geographic:</strong> US GAAP for SEC, IFRS for EU subsidiaries</li>
            <li><strong>Tax:</strong> Tax basis differs from book (cash vs accrual, depreciation)</li>
            <li><strong>Statutory:</strong> Local GAAP for legal entity filings</li>
            <li><strong>Management:</strong> Non-GAAP adjustments for internal reporting</li>
          </ul>

          <h3>Key Differences by Ledger</h3>
          
          <h4>US GAAP Ledger</h4>
          <ul>
            <li>Revenue: ASC 606 (5-step model)</li>
            <li>Leases: ASC 842 (ROU assets)</li>
            <li>Depreciation: Useful life estimates</li>
          </ul>

          <h4>IFRS Ledger</h4>
          <ul>
            <li>Revenue: IFRS 15 (similar to ASC 606)</li>
            <li>Leases: IFRS 16 (no operating lease exemption)</li>
            <li>Revaluation: PPE can be revalued upward (GAAP prohibits)</li>
          </ul>

          <h4>Tax Ledger</h4>
          <ul>
            <li>Basis: Often cash basis for small entities</li>
            <li>Depreciation: MACRS (US), CCA (Canada)</li>
            <li>Deferred tax: Book-tax differences tracked</li>
          </ul>

          <h4>Statutory Ledger</h4>
          <ul>
            <li>Legal entity specific</li>
            <li>Local chart of accounts</li>
            <li>Local currency (no consolidation adjustments)</li>
          </ul>

          <h3>Assignment Rules</h3>
          <p>
            System automatically posts transactions to appropriate ledgers:
          </p>
          <ul>
            <li><strong>Entity-based:</strong> US entity → GAAP + Tax, EU entity → IFRS + Local GAAP</li>
            <li><strong>Transaction type:</strong> Capital lease → different treatment in GAAP/Tax</li>
            <li><strong>Account mapping:</strong> One GL account may map to different accounts by ledger</li>
          </ul>

          <h3>Reconciliation Challenges</h3>
          <ul>
            <li>Timing differences (e.g. revenue recognition)</li>
            <li>Measurement differences (e.g. depreciation methods)</li>
            <li>Classification differences (e.g. debt vs equity)</li>
          </ul>

          <h3>Consolidation</h3>
          <p>
            Each ledger consolidates independently:
          </p>
          <ul>
            <li>GAAP: US parent + subs (converted to USD)</li>
            <li>IFRS: EU parent + subs (converted to EUR)</li>
            <li>Tax: By jurisdiction (no intercompany elimination)</li>
          </ul>

          <h3>Implementation Notes</h3>
          <ul>
            <li><strong>Primary ledger:</strong> Designate one ledger as source of truth (typically GAAP or IFRS)</li>
            <li><strong>Adjustment entries:</strong> Some entries only post to specific ledgers</li>
            <li><strong>Reporting currency:</strong> Each ledger can have its own reporting currency</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
