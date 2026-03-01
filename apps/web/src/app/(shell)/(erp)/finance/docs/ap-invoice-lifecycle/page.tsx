import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AP Invoice Lifecycle | Finance Docs',
  description: 'End-to-end accounts payable process flow from invoice receipt, OCR extraction, 3-way matching, approval routing, to payment execution and remittance.',
};

/**
 * AP Invoice Lifecycle Documentation
 * 
 * Process flow from invoice receipt to payment
 */
export default function APInvoiceLifecyclePage() {
  const diagramCode = `
flowchart TD
    Start([📧 Invoice Received]) --> Scan[Scan/OCR Extract]
    Scan --> Validate{Valid Invoice?}
    
    Validate -->|❌ Rejected| Reject[Return to Supplier]
    Validate -->|✓ Valid| Match{3-Way Match?}
    
    Match -->|PO + Receipt| MatchPO[Match PO Lines]
    Match -->|No PO| NonPO[Route to Approver]
    
    MatchPO --> Tolerance{Within Tolerance?}
    Tolerance -->|❌ Variance| Exception[Exception Queue]
    Tolerance -->|✓ OK| Approve
    
    NonPO --> ApprovalRule{Approval Rule}
    ApprovalRule --> Approve{Approved?}
    
    Exception --> Resolution[Buyer Resolution]
    Resolution --> Approve
    
    Approve -->|❌ Denied| Reject
    Approve -->|✓ Approved| GL[Post to GL/AP Subledger]
    
    GL --> Queue[Payment Queue]
    Queue --> Schedule{Payment Terms}
    
    Schedule --> PayRun[Payment Run]
    PayRun --> Remit[Generate Remittance]
    
    Remit --> Close([✓ Invoice Closed])
    
    style Start fill:#e3f2fd
    style Close fill:#c8e6c9
    style Reject fill:#ffcdd2
    style Exception fill:#fff9c4
    style GL fill:#f3e5f5
    style PayRun fill:#b2ebf2
    
    classDef decision fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    class Validate,Match,Tolerance,ApprovalRule,Approve,Schedule decision
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AP Invoice Lifecycle</CardTitle>
          <CardDescription>
            End-to-end process flow from invoice receipt to payment posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MermaidDiagram code={diagramCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process Details</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h3>Key Decision Points</h3>
          <ul>
            <li>
              <strong>Invoice Validation:</strong> Check for duplicate invoice numbers, valid supplier, correct tax calculations
            </li>
            <li>
              <strong>3-Way Match:</strong> PO-based invoices must match purchase order and goods receipt within tolerance
            </li>
            <li>
              <strong>Approval Routing:</strong> Non-PO invoices route by amount threshold and department rules
            </li>
            <li>
              <strong>Exception Handling:</strong> Price or quantity variances beyond tolerance go to buyer for resolution
            </li>
          </ul>

          <h3>Subledger Integration</h3>
          <p>
            Approved invoices post to both:
          </p>
          <ul>
            <li><strong>AP Subledger:</strong> Tracks supplier liability and payment terms</li>
            <li><strong>GL:</strong> Expense/asset account + AP control account</li>
          </ul>

          <h3>Payment Timing</h3>
          <p>
            Invoices enter payment queue based on payment terms. Payment runs execute:
          </p>
          <ul>
            <li>Daily for urgent payments</li>
            <li>Weekly batch for standard suppliers</li>
            <li>Monthly for monthly terms</li>
          </ul>

          <h3>Remittance Advice</h3>
          <p>
            After payment run, system generates remittance advice (email/PDF) showing:
          </p>
          <ul>
            <li>Payment date and amount</li>
            <li>Invoices included in payment</li>
            <li>Discount taken (if early payment)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
