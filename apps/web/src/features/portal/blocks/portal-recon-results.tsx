'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import type { PortalReconResult, PortalReconLine } from '../queries/portal.queries';

function ReconLineTable({
  lines,
  currencyCode,
}: {
  lines: PortalReconLine[];
  currencyCode?: string;
}) {
  if (lines.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No items in this category.</p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Reconciliation lines</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Statement Ref</TableHead>
            <TableHead className="text-right">Statement Amount</TableHead>
            <TableHead>Ledger Ref</TableHead>
            <TableHead className="text-right">Ledger Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <TableRow key={`${line.statementRef}-${i}`}>
              <TableCell className="font-mono text-sm">{line.statementRef}</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.statementAmount} currency={currencyCode} />
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {line.ledgerRef ?? '\u2014'}
              </TableCell>
              <TableCell className="text-right">
                {line.ledgerAmount ? (
                  <MoneyCell amount={line.ledgerAmount} currency={currencyCode} />
                ) : (
                  <span className="text-muted-foreground">{'\u2014'}</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={line.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface PortalReconResultsProps {
  result: PortalReconResult;
  currencyCode?: string;
}

export function PortalReconResults({ result, currencyCode }: PortalReconResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reconciliation Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-md border bg-success/5 p-3 text-center">
            <p className="text-2xl font-bold text-success">{result.matchedCount}</p>
            <p className="text-xs text-muted-foreground">Matched</p>
          </div>
          <div className="rounded-md border bg-destructive/5 p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{result.unmatchedCount}</p>
            <p className="text-xs text-muted-foreground">Unmatched</p>
          </div>
          <div className="rounded-md border bg-muted p-3 text-center">
            <p className="text-2xl font-bold">{result.statementOnlyCount}</p>
            <p className="text-xs text-muted-foreground">Statement Only</p>
          </div>
        </div>

        <Tabs defaultValue="matched">
          <TabsList>
            <TabsTrigger value="matched">Matched ({result.matchedCount})</TabsTrigger>
            <TabsTrigger value="unmatched">Unmatched ({result.unmatchedCount})</TabsTrigger>
            <TabsTrigger value="statement-only">
              Statement Only ({result.statementOnlyCount})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="matched" className="mt-4">
            <ReconLineTable lines={result.matched} currencyCode={currencyCode} />
          </TabsContent>
          <TabsContent value="unmatched" className="mt-4">
            <ReconLineTable lines={result.unmatched} currencyCode={currencyCode} />
          </TabsContent>
          <TabsContent value="statement-only" className="mt-4">
            <ReconLineTable lines={result.statementOnly} currencyCode={currencyCode} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
