'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoneyCell } from '@/components/erp/money-cell';
import { Badge } from '@/components/ui/badge';
import { FileCheck } from 'lucide-react';
import type { ApInvoiceDetail } from '../queries/ap.queries';
import type { ApHoldListItem } from '../queries/ap-hold.queries';

interface ApThreeWayMatchCardProps {
  invoice: ApInvoiceDetail;
  holds: ApHoldListItem[];
}

function parseMatchStatusFromHold(holdReason: string): {
  status: string;
  variancePercent?: number;
  tolerancePercent?: number;
} | null {
  if (holdReason.includes('3-way match') || holdReason.includes('OVER_TOLERANCE')) {
    const overMatch = holdReason.match(/OVER_TOLERANCE: variance ([\d.]+)% exceeds ([\d.]+)%/);
    if (overMatch) {
      return {
        status: 'OVER_TOLERANCE',
        variancePercent: parseFloat(overMatch[1] ?? '0'),
        tolerancePercent: parseFloat(overMatch[2] ?? '0'),
      };
    }
    if (holdReason.includes('QUANTITY_MISMATCH')) return { status: 'QUANTITY_MISMATCH' };
    if (holdReason.includes('PRICE_MISMATCH')) return { status: 'PRICE_MISMATCH' };
    return { status: 'MATCH_EXCEPTION' };
  }
  return null;
}

export function ApThreeWayMatchCard({ invoice, holds }: ApThreeWayMatchCardProps) {
  const hasRefs = invoice.poRef || invoice.receiptRef;
  if (!hasRefs) return null;

  const matchHold = holds.find((h) => h.holdType === 'MATCH_EXCEPTION');
  const matchStatus = matchHold ? parseMatchStatusFromHold(matchHold.holdReason) : null;

  const statusBadge = () => {
    if (matchStatus) {
      const variant =
        matchStatus.status === 'OVER_TOLERANCE' ||
        matchStatus.status === 'QUANTITY_MISMATCH' ||
        matchStatus.status === 'PRICE_MISMATCH'
          ? 'destructive'
          : 'secondary';
      return (
        <Badge variant={variant}>
          {matchStatus.status === 'OVER_TOLERANCE' && matchStatus.variancePercent != null
            ? `Over tolerance (${matchStatus.variancePercent}%)`
            : matchStatus.status.replace(/_/g, ' ')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No match data
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck className="h-4 w-4" aria-hidden />
          Three-way match
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <caption className="sr-only">Three-way match comparison</caption>
          <TableHeader>
            <TableRow>
              <TableHead>PO reference</TableHead>
              <TableHead>Receipt reference</TableHead>
              <TableHead className="text-right">Invoice amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-sm">{invoice.poRef ?? '—'}</TableCell>
              <TableCell className="font-mono text-sm">{invoice.receiptRef ?? '—'}</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={invoice.totalAmount} currency={invoice.currencyCode} />
              </TableCell>
              <TableCell>{statusBadge()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {!matchStatus && (invoice.poRef || invoice.receiptRef) && (
          <p className="mt-2 text-xs text-muted-foreground">
            PO and receipt amounts are not stored on the invoice. Match validation runs during
            approval when amounts are provided.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
