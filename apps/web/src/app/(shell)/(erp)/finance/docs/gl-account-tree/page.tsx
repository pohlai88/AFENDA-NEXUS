import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GL Account Tree Hierarchy | Finance Docs',
  description: 'Chart of accounts structure with asset, liability, equity, revenue, and expense hierarchies. Includes account numbering conventions and classification guidance.',
};

/**
 * GL Account Tree Hierarchy Documentation
 */
export default function GLAccountTreePage() {
  const diagramCode = `
graph TD
    ROOT[Chart of Accounts]
    
    ROOT --> ASSETS[1000-1999<br/>Assets]
    ROOT --> LIAB[2000-2999<br/>Liabilities]
    ROOT --> EQUITY[3000-3999<br/>Equity]
    ROOT --> REV[4000-4999<br/>Revenue]
    ROOT --> EXP[5000-9999<br/>Expenses]
    
    ASSETS --> CA[1000-1499<br/>Current Assets]
    ASSETS --> NCA[1500-1999<br/>Non-Current Assets]
    
    CA --> CASH[1000-1099<br/>Cash & Equivalents]
    CA --> AR[1100-1299<br/>Receivables]
    CA --> INV[1300-1499<br/>Inventory]
    
    CASH --> CASH1[1000 Petty Cash]
    CASH --> CASH2[1010 Operating Acct]
    CASH --> CASH3[1020 Payroll Acct]
    
    AR --> AR1[1100 AR Trade]
    AR --> AR2[1110 AR Allowance]
    AR --> AR3[1120 AR Employee]
    
    NCA --> FA[1500-1699<br/>Fixed Assets]
    NCA --> INTANG[1700-1799<br/>Intangibles]
    
    FA --> FA1[1500 Land]
    FA --> FA2[1510 Buildings]
    FA --> FA3[1520 Equipment]
    FA --> FA4[1550 Accum Deprec]
    
    LIAB --> CL[2000-2499<br/>Current Liabilities]
    LIAB --> LTL[2500-2999<br/>Long-Term Liabilities]
    
    CL --> AP[2100 AP Trade]
    CL --> ACCR[2200 Accrued Exp]
    CL --> CURLTD[2300 Current LT Debt]
    
    LTL --> LTD[2500 Long-Term Debt]
    LTL --> DEF[2600 Deferred Tax]
    
    REV --> SALES[4000-4499<br/>Sales Revenue]
    REV --> OTHER[4500-4999<br/>Other Revenue]
    
    SALES --> PROD[4000 Product Sales]
    SALES --> SVCS[4100 Service Revenue]
    
    EXP --> COGS[5000-5999<br/>COGS]
    EXP --> OPEX[6000-8999<br/>Operating Expenses]
    EXP --> NONOP[9000-9999<br/>Non-Operating]
    
    OPEX --> SAL[6000 Salaries]
    OPEX --> RENT[6100 Rent]
    OPEX --> MKT[6200 Marketing]
    
    style ROOT fill:#1976d2,color:#fff
    style ASSETS fill:#43a047,color:#fff
    style LIAB fill:#fb8c00,color:#fff
    style EQUITY fill:#e53935,color:#fff
    style REV fill:#00acc1,color:#fff
    style EXP fill:#ab47bc,color:#fff
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GL Account Tree Hierarchy</CardTitle>
          <CardDescription>
            Chart of accounts structure with rollup hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts Design</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Account Numbering Scheme</h3>
          <p>
            Standard 4-digit numbering with ranges by financial statement section:
          </p>
          <ul>
            <li><strong>1000-1999:</strong> Assets (balance sheet)</li>
            <li><strong>2000-2999:</strong> Liabilities (balance sheet)</li>
            <li><strong>3000-3999:</strong> Equity (balance sheet)</li>
            <li><strong>4000-4999:</strong> Revenue (income statement)</li>
            <li><strong>5000-9999:</strong> Expenses (income statement)</li>
          </ul>

          <h3>Hierarchy Levels</h3>
          <ol>
            <li><strong>Level 1 (Root):</strong> Financial statement category (Assets, Liabilities, etc.)</li>
            <li><strong>Level 2 (Rollup):</strong> Sub-category (Current Assets, Fixed Assets)</li>
            <li><strong>Level 3 (Section):</strong> Account group (Cash, AR, Inventory)</li>
            <li><strong>Level 4 (Detail):</strong> Posting account (Operating Account, Payroll Account)</li>
          </ol>

          <h3>Key Account Groups</h3>
          
          <h4>Assets (1000-1999)</h4>
          <ul>
            <li><strong>1000-1099:</strong> Cash & Equivalents</li>
            <li><strong>1100-1299:</strong> Receivables (Trade, Employee, Other)</li>
            <li><strong>1300-1499:</strong> Inventory (Raw Materials, WIP, Finished Goods)</li>
            <li><strong>1500-1699:</strong> Fixed Assets (Land, Buildings, Equipment)</li>
            <li><strong>1700-1799:</strong> Intangibles (Patents, Goodwill, Software)</li>
            <li><strong>1800-1999:</strong> Other Assets (Deposits, Deferred Tax)</li>
          </ul>

          <h4>Liabilities (2000-2999)</h4>
          <ul>
            <li><strong>2000-2099:</strong> Short-Term Debt & Lines of Credit</li>
            <li><strong>2100-2199:</strong> Accounts Payable</li>
            <li><strong>2200-2299:</strong> Accrued Expenses (Payroll, Interest, Utilities)</li>
            <li><strong>2300-2399:</strong> Current Portion of Long-Term Debt</li>
            <li><strong>2500-2599:</strong> Long-Term Debt</li>
            <li><strong>2600-2999:</strong> Other Long-Term Liabilities (Deferred Tax, Pension)</li>
          </ul>

          <h4>Equity (3000-3999)</h4>
          <ul>
            <li><strong>3000:</strong> Common Stock</li>
            <li><strong>3100:</strong> Preferred Stock</li>
            <li><strong>3200:</strong> Additional Paid-In Capital</li>
            <li><strong>3300:</strong> Retained Earnings</li>
            <li><strong>3400:</strong> Treasury Stock</li>
            <li><strong>3500:</strong> Accumulated OCI</li>
          </ul>

          <h4>Revenue (4000-4999)</h4>
          <ul>
            <li><strong>4000-4299:</strong> Product Sales (by product line)</li>
            <li><strong>4300-4599:</strong> Service Revenue</li>
            <li><strong>4600-4799:</strong> Other Operating Revenue (Royalties, Rentals)</li>
            <li><strong>4800-4999:</strong> Sales Adjustments (Returns, Discounts)</li>
          </ul>

          <h4>Expenses (5000-9999)</h4>
          <ul>
            <li><strong>5000-5999:</strong> Cost of Goods Sold</li>
            <li><strong>6000-6999:</strong> Operating Expenses (Salaries, Rent, Marketing)</li>
            <li><strong>7000-7999:</strong> Depreciation & Amortization</li>
            <li><strong>8000-8999:</strong> Other Operating Expenses</li>
            <li><strong>9000-9999:</strong> Non-Operating (Interest, FX Gains/Losses, Tax)</li>
          </ul>

          <h3>Account Attributes</h3>
          <p>
            Each account has metadata:
          </p>
          <ul>
            <li><strong>Type:</strong> Asset, Liability, Equity, Revenue, Expense</li>
            <li><strong>Normal balance:</strong> Debit or Credit</li>
            <li><strong>Rollup parent:</strong> For hierarchy</li>
            <li><strong>Active/Inactive:</strong> Status flag</li>
            <li><strong>Currency:</strong> If multi-currency</li>
            <li><strong>Require dimensions:</strong> Department, project, location tags</li>
          </ul>

          <h3>Best Practices</h3>
          <ul>
            <li><strong>Leave gaps:</strong> Allow room for future accounts (e.g. 1000, 1010, 1020)</li>
            <li><strong>Control accounts:</strong> AR, AP, Fixed Assets should be control accounts (lock from manual entries)</li>
            <li><strong>Retired accounts:</strong> Mark inactive, don't delete (preserve history)</li>
            <li><strong>Natural accounts:</strong> Avoid encoding dimensions in account number (use tagging instead)</li>
          </ul>

          <h3>Segment Reporting</h3>
          <p>
            For multi-dimensional reporting, extend with:
          </p>
          <ul>
            <li><strong>Department:</strong> Engineering, Sales, Admin</li>
            <li><strong>Location:</strong> New York, London, Singapore</li>
            <li><strong>Product:</strong> Product A, Product B</li>
            <li><strong>Project:</strong> Customer projects, internal initiatives</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
