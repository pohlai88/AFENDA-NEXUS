'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { ExpenseClaimDetail, ExpenseLineView } from '../queries/expenses.queries';

// ─── Detail Header ──────────────────────────────────────────────────────────

export function ExpenseDetailHeader({ claim }: { claim: ExpenseClaimDetail }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-muted-foreground">{claim.claimNumber}</div>
        <h2 className="text-lg font-semibold">{claim.title}</h2>
        <p className="text-sm text-muted-foreground">
          {claim.employeeName} &middot; {claim.department}
        </p>
      </div>
      <Badge>{claim.status}</Badge>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function ExpenseOverview({ claim }: { claim: ExpenseClaimDetail }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Total Amount" value={formatCurrency(claim.totalAmount, claim.currency)} />
      <Field label="Status" value={claim.status} />
      <Field label="Lines" value={String(claim.lineCount)} />
      <Field label="Period" value={`${claim.periodFrom} — ${claim.periodTo}`} />
      <Field label="Submitted" value={claim.submittedDate ?? '—'} />
      {claim.approvedAmount != null && <Field label="Approved Amount" value={formatCurrency(claim.approvedAmount, claim.currency)} />}
      {claim.approvedBy && <Field label="Approved By" value={claim.approvedBy} />}
      {claim.paidDate && <Field label="Paid" value={claim.paidDate} />}
      {claim.rejectionReason && <Field label="Rejection Reason" value={claim.rejectionReason} />}
      {claim.description && <Field label="Description" value={claim.description} />}
    </div>
  );
}

// ─── Expense Lines Table ────────────────────────────────────────────────────

export function ExpenseLinesTable({ lines }: { lines: ExpenseLineView[] }) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">No expense lines.</p>;
  }

  return (
    <Table>
      <TableCaption>Expense lines</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Merchant</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Receipt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell>{line.expenseDate}</TableCell>
            <TableCell>{line.category}</TableCell>
            <TableCell>{line.description}</TableCell>
            <TableCell>{line.merchantName}</TableCell>
            <TableCell className="font-mono text-right">{formatCurrency(line.amount, line.currency)}</TableCell>
            <TableCell>
              <Badge variant={line.receiptAttached ? 'default' : 'outline'}>
                {line.receiptAttached ? 'Yes' : 'No'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
