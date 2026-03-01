'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { BookOpen, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PostingLinePreview {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  costCenter?: string;
  entity?: string;
}

export interface PostingPreviewData {
  /** Ledger name the entries will post to */
  ledgerName: string;
  /** Fiscal period name */
  periodName: string;
  /** Currency code */
  currency: string;
  /** Preview journal entries */
  lines: PostingLinePreview[];
  /** Optional warnings (e.g. period about to close, large balance, etc.) */
  warnings?: string[];
}

interface PostingPreviewProps {
  /** Preview data to display */
  data: PostingPreviewData;
  /** Called when user confirms the posting */
  onConfirm: () => Promise<void>;
  /** Title for the confirmation dialog */
  title?: string;
  /** Description text */
  description?: string;
  /** Whether the action is loading externally */
  isLoading?: boolean;
  /** Custom confirm button text */
  confirmLabel?: string;
  /** Custom cancel button text */
  cancelLabel?: string;
  /** Compact mode hides some metadata */
  compact?: boolean;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PostingPreview({
  data,
  onConfirm,
  title = 'Posting Preview',
  description,
  isLoading: externalLoading,
  confirmLabel = 'Post to Ledger',
  cancelLabel = 'Cancel',
  compact = false,
  className,
}: PostingPreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isLoading = externalLoading || isPending;

  const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.005;

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      setDialogOpen(false);
    });
  };

  return (
    <>
      <Card className={cn('border-dashed', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{data.ledgerName}</Badge>
              <Badge variant="secondary">{data.periodName}</Badge>
              <Badge variant="secondary">{data.currency}</Badge>
            </div>
          </div>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warnings */}
          {data.warnings && data.warnings.length > 0 && (
            <div className="space-y-1">
              {data.warnings.map((warning, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-warning bg-warning/10 rounded-md px-3 py-2"
                  role="alert"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Preview Lines Table */}
          <Table>
            <caption className="sr-only">Posting preview lines</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                {!compact && <TableHead>Description</TableHead>}
                {!compact && <TableHead>Cost Center</TableHead>}
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lines.map((line, index) => (
                <TableRow key={index} className="text-sm">
                  <TableCell>
                    <div>
                      <span className="font-mono font-medium">{line.accountCode}</span>
                      <span className="text-muted-foreground ml-2">{line.accountName}</span>
                    </div>
                  </TableCell>
                  {!compact && <TableCell className="text-muted-foreground">{line.description ?? '—'}</TableCell>}
                  {!compact && <TableCell className="text-muted-foreground">{line.costCenter ?? '—'}</TableCell>}
                  <TableCell className="text-right font-mono">
                    {line.debit > 0 ? formatCurrency(line.debit, data.currency) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {line.credit > 0 ? formatCurrency(line.credit, data.currency) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-medium">
                <TableCell colSpan={compact ? 1 : 3}>
                  <div className="flex items-center gap-2">
                    Total ({data.lines.length} lines)
                    {isBalanced ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalDebit, data.currency)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalCredit, data.currency)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {!isBalanced && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Journal is out of balance by {formatCurrency(Math.abs(totalDebit - totalCredit), data.currency)}.
              This posting cannot proceed.
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Will post {data.lines.length} line{data.lines.length !== 1 ? 's' : ''} to ledger &quot;{data.ledgerName}&quot;
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={!isBalanced || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Posting</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to post {data.lines.length} journal line{data.lines.length !== 1 ? 's' : ''} totalling{' '}
              {formatCurrency(totalDebit, data.currency)} to ledger &quot;{data.ledgerName}&quot; for period &quot;{data.periodName}&quot;.
              This action will be recorded in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
