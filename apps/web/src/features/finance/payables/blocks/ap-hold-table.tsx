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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/erp/status-badge';
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
import { Loader2, ShieldAlert, Unlock } from 'lucide-react';
import { releaseHoldAction } from '../actions/ap-hold.actions';
import { routes } from '@/lib/constants';
import type { ApHoldListItem } from '../queries/ap-hold.queries';

interface ApHoldTableProps {
  data: ApHoldListItem[];
}

const HOLD_TYPE_LABELS: Record<string, string> = {
  DUPLICATE: 'Duplicate',
  MATCH_EXCEPTION: 'Match Exception',
  VALIDATION: 'Validation',
  APPROVAL: 'Approval',
  FX_RATE: 'FX Rate',
  MANUAL: 'Manual',
};

export function ApHoldTable({ data }: ApHoldTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [releaseTarget, setReleaseTarget] = useState<ApHoldListItem | null>(null);
  const [releaseReason, setReleaseReason] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    return <EmptyState contentKey="finance.payables.holds" constraint="table" icon={ShieldAlert} />;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Invoice holds — {data.length} holds</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((hold) => (
              <TableRow
                key={hold.id}
                className="cursor-pointer"
                tabIndex={0}
                role="link"
                aria-label={`Open invoice ${hold.invoiceNumber} with ${hold.holdType} hold`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = routes.finance.payableDetail(hold.invoiceId);
                  }
                }}
              >
                <TableCell>
                  <Link
                    href={routes.finance.payableDetail(hold.invoiceId)}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {hold.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{hold.supplierName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {HOLD_TYPE_LABELS[hold.holdType] ?? hold.holdType}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {hold.holdReason}
                </TableCell>
                <TableCell>
                  <StatusBadge status={hold.status} />
                </TableCell>
                <TableCell>
                  <DateCell date={hold.createdAt} format="short" />
                </TableCell>
                <TableCell>
                  {hold.status === 'ACTIVE' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReleaseTarget(hold);
                      }}
                    >
                      <Unlock className="mr-1 h-3 w-3" />
                      Release
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Release dialog */}
      <Dialog open={!!releaseTarget} onOpenChange={(open) => !open && setReleaseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Hold</DialogTitle>
            <DialogDescription>
              Release the {releaseTarget && HOLD_TYPE_LABELS[releaseTarget.holdType]} hold on
              invoice {releaseTarget?.invoiceNumber}.
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
              placeholder="Reason for releasing this hold"
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
            <Button onClick={handleRelease} disabled={isPending || !releaseReason.trim()}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Release Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
