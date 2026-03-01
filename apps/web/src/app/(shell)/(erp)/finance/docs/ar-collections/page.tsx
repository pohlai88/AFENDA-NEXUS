import { MermaidDiagram } from '@/components/diagrams/mermaid-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AR Collections Process | Finance Docs',
  description: 'Accounts receivable collections workflow with aging-based escalation, dunning automation, payment reminders, collection calls, and write-off procedures.',
};

/**
 * AR Collections Process Documentation
 */
export default function ARCollectionsProcessPage() {
  const diagramCode = `
flowchart TD
    Start([📋 Invoice Issued]) --> Aging[Calculate Aging]
    Aging --> Check{Days Outstanding}
    
    Check -->|0-30d| Current[Current - No Action]
    Check -->|31-60d| Reminder[📧 Payment Reminder]
    Check -->|61-90d| Call[📞 Collection Call]
    Check -->|90+d| Escalate[⚠️ Escalation Process]
    
    Reminder --> Wait1[Wait 7 Days]
    Call --> Wait2[Wait 14 Days]
    
    Wait1 --> Paid1{Paid?}
    Wait2 --> Paid2{Paid?}
    
    Paid1 -->|✓ Yes| Close
    Paid1 -->|❌ No| Call
    Paid2 -->|✓ Yes| Close
    Paid2 -->|❌ No| Escalate
    
    Escalate --> Manager[Collection Manager Review]
    Manager --> Action{Action}
    
    Action -->|Legal| Legal[External Collections]
    Action -->|Hold| CreditHold[Credit Hold]
    Action -->|WriteOff| WriteOff[Bad Debt Write-Off]
    
    Legal --> Recovery{Recovered?}
    Recovery -->|✓ Partial/Full| Close
    Recovery -->|❌ Failed| WriteOff
    
    CreditHold --> Negotiate[Payment Plan]
    Negotiate --> Monitor[Monitor Plan]
    Monitor --> Close
    
    WriteOff --> Archive([Archive - Closed])
    Current --> Close([✓ Invoice Closed])
    Close --> Archive
    
    style Start fill:#e3f2fd
    style Archive fill:#c8e6c9
    style WriteOff fill:#ffcdd2
    style Escalate fill:#fff9c4
    style Legal fill:#ffe0b2
    
    classDef decision fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    class Check,Paid1,Paid2,Action,Recovery decision
  `;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AR Collections Process</CardTitle>
          <CardDescription>
            Automated collections workflow based on aging buckets
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
          <h3>Aging Buckets & Actions</h3>
          <ul>
            <li><strong>0-30 days:</strong> Current - No action required</li>
            <li><strong>31-60 days:</strong> Automated email reminder with invoice PDF</li>
            <li><strong>61-90 days:</strong> Collection call from AR team</li>
            <li><strong>90+ days:</strong> Escalation to collection manager</li>
          </ul>

          <h3>Escalation Options</h3>
          <ul>
            <li><strong>External Collections:</strong> For significant amounts with unresponsive customers</li>
            <li><strong>Credit Hold:</strong> Block new orders until balance cleared</li>
            <li><strong>Payment Plan:</strong> Negotiate installment terms for financial hardship</li>
            <li><strong>Write-Off:</strong> Bad debt expense when collection is unlikely</li>
          </ul>

          <h3>Metrics Tracked</h3>
          <ul>
            <li>Days Sales Outstanding (DSO)</li>
            <li>Collection Effectiveness Index (CEI)</li>
            <li>Bad debt as % of revenue</li>
            <li>Average days to collect by customer segment</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
