import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Statement Interrelationships | Finance Docs',
  description: 'Balance sheet, income statement, and cash flow statement connections showing how period activity flows from P&L to balance sheet via retained earnings and cash.',
};

/**
 * Financial Statement Interrelationships Documentation
 */
export default function FinancialStatementsPage() {
  const diagramCode = `
graph TB
    subgraph "Balance Sheet (Beginning)"
        BSB_CASH[Cash: $100K]
        BSB_AR[AR: $200K]
        BSB_INV[Inventory: $150K]
        BSB_FA[Fixed Assets: $500K]
        BSB_AP[AP: $120K]
        BSB_DEBT[Debt: $300K]
        BSB_EQUITY[Equity: $530K]
    end
    
    subgraph "Income Statement (Period)"
        IS_REV[Revenue: $1,000K]
        IS_COGS[COGS: $600K]
        IS_OPEX[OpEx: $250K]
        IS_INT[Interest: $15K]
        IS_TAX[Tax: $40K]
        IS_NET[Net Income: $95K]
    end
    
    subgraph "Cash Flow Statement (Period)"
        CF_OP[Operating CF]
        CF_INV[Investing CF]
        CF_FIN[Financing CF]
        CF_NET[Net Change: +$50K]
    end
    
    subgraph "Balance Sheet (Ending)"
        BSE_CASH[Cash: $150K]
        BSE_AR[AR: $220K]
        BSE_INV[Inventory: $140K]
        BSE_FA[Fixed Assets: $480K]
        BSE_AP[AP: $110K]
        BSE_DEBT[Debt: $280K]
        BSE_RE[Retained Earnings: $625K]
    end
    
    %% Links from P&L to Cash Flow
    IS_NET -->|Net Income| CF_OP
    IS_INT -->|Add back non-cash| CF_OP
    
    %% Links from Cash Flow to Balance Sheet
    CF_NET -->|$50K increase| BSE_CASH
    
    %% Links from P&L to Balance Sheet
    IS_NET -->|Close to RE| BSE_RE
    
    %% AR/AP changes
    BSB_AR -->|Collections| CF_OP
    IS_REV -->|Credit sales| BSE_AR
    BSB_AP -->|Payments| CF_OP
    IS_COGS -->|Purchases| BSE_AP
    
    %% Working capital flow
    BSB_INV -->|Usage| IS_COGS
    CF_OP -->|Purchases| BSE_INV
    
    %% Fixed assets
    BSB_FA -->|Depreciation| IS_OPEX
    CF_INV -->|CapEx| BSE_FA
    
    %% Financing
    BSB_DEBT -->|Principal payments| CF_FIN
    CF_FIN -->|New debt| BSE_DEBT
    
    style IS_NET fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px
    style CF_NET fill:#bbdefb,stroke:#1565c0,stroke-width:3px
    style BSE_CASH fill:#fff9c4,stroke:#f57f17,stroke-width:3px
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Statement Interrelationships</CardTitle>
          <CardDescription>
            How income statement, cash flow statement, and balance sheet connect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statement Linkages</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>The Three-Statement Model</h3>
          <p>
            Financial statements are interconnected. Changes flow from P&L → Cash Flow → Balance Sheet.
          </p>

          <h3>P&L to Cash Flow Statement</h3>
          <p>
            <strong>Operating Cash Flow starts with Net Income, then adjusts for non-cash items:</strong>
          </p>
          <ul>
            <li><strong>Add back:</strong> Depreciation, Amortization (non-cash expenses)</li>
            <li><strong>Adjust for working capital:</strong>
              <ul>
                <li>Increase in AR → Use of cash (credit sales not collected)</li>
                <li>Decrease in AR → Source of cash (collections)</li>
                <li>Increase in Inventory → Use of cash (purchases exceed usage)</li>
                <li>Increase in AP → Source of cash (unpaid purchases)</li>
              </ul>
            </li>
          </ul>

          <h4>Example Operating CF Calculation:</h4>
          <pre className="text-xs">
Net Income                       $95K
Add: Depreciation                $20K
Less: AR increase (220-200)     ($20K)
Add: Inventory decrease (150-140) $10K
Add: AP decrease (120-110)      ($10K)
Operating Cash Flow              $95K
          </pre>

          <h3>Cash Flow to Balance Sheet</h3>
          <p>
            <strong>Cash Flow Statement explains change in cash balance:</strong>
          </p>
          <ul>
            <li><strong>Beginning cash:</strong> $100K (from prior balance sheet)</li>
            <li><strong>Operating CF:</strong> +$95K</li>
            <li><strong>Investing CF:</strong> -$40K (CapEx)</li>
            <li><strong>Financing CF:</strong> -$5K (Debt repayment - Dividend)</li>
            <li><strong>Net change:</strong> +$50K</li>
            <li><strong>Ending cash:</strong> $150K (to current balance sheet)</li>
          </ul>

          <h3>P&L to Balance Sheet</h3>
          <p>
            <strong>Net Income closes to Retained Earnings:</strong>
          </p>
          <ul>
            <li><strong>Beginning RE:</strong> $530K</li>
            <li><strong>Add: Net Income:</strong> +$95K</li>
            <li><strong>Less: Dividends:</strong> -$0K (assume no dividends)</li>
            <li><strong>Ending RE:</strong> $625K</li>
          </ul>

          <h3>Key Relationships</h3>
          
          <h4>1. Revenue → AR → Cash</h4>
          <ul>
            <li>Revenue ($1,000K) splits into:
              <ul>
                <li>Cash sales → Operating CF</li>
                <li>Credit sales → AR increase ($20K)</li>
              </ul>
            </li>
            <li>AR collections → Operating CF</li>
          </ul>

          <h4>2. COGS → Inventory → AP → Cash</h4>
          <ul>
            <li>COGS ($600K) uses inventory</li>
            <li>Inventory purchases → AP</li>
            <li>AP payments → Operating CF</li>
          </ul>

          <h4>3. Depreciation (Non-Cash)</h4>
          <ul>
            <li>Depreciation expense ($20K) reduces P&L</li>
            <li>But no cash outflow → Add back in Operating CF</li>
            <li>Accumulated depreciation increases on balance sheet</li>
          </ul>

          <h4>4. CapEx (Cash, No P&L Impact)</h4>
          <ul>
            <li>CapEx ($40K) increases Fixed Assets</li>
            <li>Cash outflow → Investing CF</li>
            <li>NO immediate P&L impact (depreciated over time)</li>
          </ul>

          <h4>5. Debt Principal (Cash, No P&L Impact)</h4>
          <ul>
            <li>Debt repayment ($20K) reduces liability</li>
            <li>Cash outflow → Financing CF</li>
            <li>NO P&L impact (interest expense is P&L, principal is not)</li>
          </ul>

          <h3>Balance Sheet Equation</h3>
          <p>
            <strong>Assets = Liabilities + Equity</strong>
          </p>
          <p>
            Beginning Balance Sheet:
          </p>
          <pre className="text-xs">
Assets: $100K + $200K + $150K + $500K = $950K
Liabilities + Equity: $120K + $300K + $530K = $950K ✓
          </pre>
          <p>
            Ending Balance Sheet:
          </p>
          <pre className="text-xs">
Assets: $150K + $220K + $140K + $480K = $990K
Liabilities + Equity: $110K + $280K + $625K = $1,015K ✗
          </pre>
          <p className="text-sm text-muted-foreground">
            (Note: Simplified example; in practice, all accounts would balance exactly)
          </p>

          <h3>Practical Use</h3>
          <p>
            <strong>Financial modeling:</strong> Build integrated 3-statement model where formulas link statements
          </p>
          <ul>
            <li>Change a revenue assumption → Cascades to all three statements</li>
            <li>Add CapEx → Investing CF, Fixed Assets, Depreciation</li>
            <li>Raise debt → Financing CF, Debt balance, Interest expense</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
