'use client';

import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTable } from '@/components/erp/data-table';
import type {
  AllocationRunDetailView,
  AllocationLineView,
} from '../queries/cost-accounting.queries';
import { allocationMethodLabels, allocationStatusConfig } from '../types';

interface AllocationRunDetailProps {
  run: AllocationRunDetailView;
}

export function AllocationRunDetail({ run }: AllocationRunDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{run.runNumber}</h2>
          <StatusBadge status={run.status} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Period</dt>
            <dd className="mt-0.5 text-sm">{run.period}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Method</dt>
            <dd className="mt-0.5 text-sm">
              {allocationMethodLabels[run.method as keyof typeof allocationMethodLabels] ?? run.method}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Total Allocated</dt>
            <dd className="mt-0.5 text-sm">
              <MoneyCell amount={run.totalAllocated} currency={run.currency} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Cost Centers Affected</dt>
            <dd className="mt-0.5 text-sm">{run.costCentersAffected}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Rules Applied</dt>
            <dd className="mt-0.5 text-sm">{run.rulesApplied}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Initiated By</dt>
            <dd className="mt-0.5 text-sm">{run.initiatedBy}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Initiated At</dt>
            <dd className="mt-0.5 text-sm"><DateCell date={run.initiatedAt} /></dd>
          </div>
          {run.journalEntryNumber && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Journal Entry</dt>
              <dd className="mt-0.5 text-sm font-mono">{run.journalEntryNumber}</dd>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Lines Table */}
      {run.lines.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Allocation Details</h3>
          <div className="rounded-md border">
            <Table>
              <caption className="sr-only">Allocation details</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Driver Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.ruleName}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{line.fromCostCenterCode}</span>{' '}
                      {line.fromCostCenterName}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{line.toCostCenterCode}</span>{' '}
                      {line.toCostCenterName}
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyCell amount={line.amount} currency={run.currency} />
                    </TableCell>
                    <TableCell className="text-right">{line.percentage}%</TableCell>
                    <TableCell className="text-right">{line.driverValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
