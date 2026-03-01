'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DateCell } from '@/components/erp/date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Unlock } from 'lucide-react';
import { releaseHoldAction } from '../actions/ap-hold.actions';
import { getApInvoiceDetailAction } from '../actions/ap.actions';
import { routes } from '@/lib/constants';
import type { ApHoldListItem } from '../queries/ap-hold.queries';
import type { ApInvoiceDetail } from '../queries/ap.queries';

interface ApDuplicateReviewTableProps {
  data: ApHoldListItem[];
}

/** Parse "Potential duplicate of invoice(s): id1, id2" to extract invoice IDs. */
function parseDuplicateIds(holdReason: string): string[] {
  const match = holdReason.match(/Potential duplicate of invoice\(s\):\s*(.+)/);
  if (!match) return [];
  return (match[1] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ApDuplicateReviewTable({ data }: ApDuplicateReviewTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [compareTarget, setCompareTarget] = useState<ApHoldListItem | null>(null);
  const [invoices, setInvoices] = useState<ApInvoiceDetail[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<ApHoldListItem | null>(null);
  const [releaseReason, setReleaseReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCompare(hold: ApHoldListItem) {
    setCompareTarget(hold);
    setLoadingCompare(true);
    setInvoices([]);
    setError(null);

    const ids = [hold.invoiceId, ...parseDuplicateIds(hold.holdReason)];
    const results = await Promise.all(ids.map((id) => getApInvoiceDetailAction(id)));

    const loaded: ApInvoiceDetail[] = [];
    for (const r of results) {
      if (r.ok) loaded.push(r.value);
    }
    setInvoices(loaded);
    setLoadingCompare(false);
  }

  function handleRelease() {
    if (!releaseTarget || !releaseReason.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await releaseHoldAction(releaseTarget.id, releaseReason.trim());
      if (result.ok) {
        setReleaseTarget(null);
        setReleaseReason('');
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Copy}
        title="No duplicate holds"
        description="Invoices flagged as potential duplicates will appear here for review."
      />
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Duplicate invoice holds — {data.length} holds</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Duplicate Of</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((hold) => {
              const dupeIds = parseDuplicateIds(hold.holdReason);
              return (
                <TableRow key={hold.id}>
                  <TableCell>
                    <Link
                      href={routes.finance.payableDetail(hold.invoiceId)}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {hold.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{hold.supplierName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dupeIds.length > 0 ? `${dupeIds.length} invoice(s)` : '—'}
                  </TableCell>
                  <TableCell>
                    <DateCell date={hold.createdAt} format="short" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompare(hold)}
                        disabled={dupeIds.length === 0}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Compare
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReleaseTarget(hold)}
                      >
                        <Unlock className="mr-1 h-3 w-3" />
                        Release
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Side-by-side comparison dialog */}
      <Dialog open={!!compareTarget} onOpenChange={(open) => !open && setCompareTarget(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Side-by-Side Comparison</DialogTitle>
            <DialogDescription>
              Compare invoice details to confirm if these are duplicates.
            </DialogDescription>
          </DialogHeader>
          {loadingCompare ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="font-mono font-medium">{inv.invoiceNumber}</div>
                  <div className="text-sm text-muted-foreground">{inv.supplierName}</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Amount:</span>{' '}
                    {inv.totalAmount} {inv.currencyCode}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Date:</span> {inv.invoiceDate}
                  </div>
                  {inv.supplierRef && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Supplier Ref:</span> {inv.supplierRef}
                    </div>
                  )}
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link href={routes.finance.payableDetail(inv.id)}>View full invoice</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release dialog */}
      <Dialog open={!!releaseTarget} onOpenChange={(open) => !open && setReleaseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Duplicate Hold</DialogTitle>
            <DialogDescription>
              Release the duplicate hold on invoice {releaseTarget?.invoiceNumber}. Confirm these
              are not duplicates before releasing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="release-reason">
              Release Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="release-reason"
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="e.g. Confirmed not a duplicate"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleRelease}
              disabled={isPending || !releaseReason.trim()}
            >
              { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Release Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
