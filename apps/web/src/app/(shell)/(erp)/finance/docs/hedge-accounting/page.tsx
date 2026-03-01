import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hedge Accounting Designation Flow | Finance Docs',
  description: 'IFRS 9 hedge accounting guidance covering fair value, cash flow, and net investment hedges with effectiveness testing, designation, and accounting treatment.',
};

/**
 * Hedge Accounting Designation Flow Documentation
 */
export default function HedgeAccountingFlowPage() {
  const diagramCode = `
flowchart TD
    Start([🎯 Identify Risk Exposure]) --> Type{Hedge Type}
    
    Type -->|Fair Value| FVH[Fair Value Hedge]
    Type -->|Cash Flow| CFH[Cash Flow Hedge]
    Type -->|Net Investment| NIH[Net Investment Hedge]
    
    FVH --> DocFV[Document Hedge Strategy]
    CFH --> DocCF[Document Hedge Strategy]
    NIH --> DocNI[Document Hedge Strategy]
    
    DocFV --> Test1[Effectiveness Test]
    DocCF --> Test2[Effectiveness Test]
    DocNI --> Test3[Effectiveness Test]
    
    Test1 --> Range1{80-125% Effective?}
    Test2 --> Range2{80-125% Effective?}
    Test3 --> Range3{80-125% Effective?}
    
    Range1 -->|✓ Yes| Designate1[Designate Hedge]
    Range2 -->|✓ Yes| Designate2[Designate Hedge]
    Range3 -->|✓ Yes| Designate3[Designate Hedge]
    
    Range1 -->|❌ No| Fail[Hedge Accounting Denied]
    Range2 -->|❌ No| Fail
    Range3 -->|❌ No| Fail
    
    Designate1 --> Account1[FV: Offset to P&L]
    Designate2 --> Account2[CF: Defer to OCI]
    Designate3 --> Account3[NI: CTA in Equity]
    
    Account1 --> Monitor[Quarterly Effectiveness Testing]
    Account2 --> Monitor
    Account3 --> Monitor
    
    Monitor --> Ongoing{Still Effective?}
    Ongoing -->|✓ Yes| Continue[Continue Hedge Accounting]
    Ongoing -->|❌ No| Discontinue[Discontinue Hedge]
    
    Continue --> Monitor
    Discontinue --> Reclassify[Reclassify from OCI]
    
    Fail --> MTM[Mark-to-Market via P&L]
    Reclassify --> MTM
    MTM --> Close([Close Hedge])
    
    style Start fill:#e3f2fd
    style Close fill:#c8e6c9
    style Fail fill:#ffcdd2
    style Discontinue fill:#fff9c4
    
    classDef decision fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    class Type,Range1,Range2,Range3,Ongoing decision
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hedge Accounting Designation Flow</CardTitle>
          <CardDescription>
            Process for designating and maintaining hedge accounting relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hedge Types & Accounting</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Fair Value Hedge</h3>
          <p>
            <strong>Purpose:</strong> Offset changes in fair value of recognized assets/liabilities or firm commitments
          </p>
          <p>
            <strong>Accounting:</strong> Both hedged item and derivative marked to market through P&L (gains/losses offset)
          </p>
          <p>
            <strong>Example:</strong> Interest rate swap hedging fixed-rate debt
          </p>

          <h3>Cash Flow Hedge</h3>
          <p>
            <strong>Purpose:</strong> Reduce variability in cash flows from forecasted transactions
          </p>
          <p>
            <strong>Accounting:</strong> Effective portion of derivative gains/losses deferred in OCI, released to P&L when hedged transaction occurs
          </p>
          <p>
            <strong>Example:</strong> Foreign currency forward hedging future inventory purchases
          </p>

          <h3>Net Investment Hedge</h3>
          <p>
            <strong>Purpose:</strong> Hedge FX risk on investment in foreign subsidiary
          </p>
          <p>
            <strong>Accounting:</strong> Gains/losses on derivative accumulate in CTA (cumulative translation adjustment) in equity
          </p>
          <p>
            <strong>Example:</strong> Cross-currency swap hedging EUR subsidiary
          </p>

          <h3>Effectiveness Testing</h3>
          <p>
            To qualify for hedge accounting, effectiveness must be 80-125%:
          </p>
          <ul>
            <li><strong>Prospective:</strong> At designation, demonstrate expected effectiveness</li>
            <li><strong>Retrospective:</strong> Quarterly, measure actual effectiveness</li>
            <li><strong>Methods:</strong> Dollar-offset, regression analysis, or matched terms</li>
          </ul>

          <h3>Documentation Requirements</h3>
          <ul>
            <li>Risk management objective and strategy</li>
            <li>Identification of hedging instrument and hedged item</li>
            <li>Nature of risk being hedged</li>
            <li>Effectiveness assessment method</li>
            <li>Documentation must be contemporaneous (at designation)</li>
          </ul>

          <h3>Discontinuation Events</h3>
          <ul>
            <li>Effectiveness falls outside 80-125% range</li>
            <li>Hedged forecasted transaction no longer probable</li>
            <li>Derivative expired, sold, or exercised</li>
            <li>Management voluntarily de-designates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
