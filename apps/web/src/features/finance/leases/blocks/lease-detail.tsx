'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LeaseContract, LeaseScheduleEntry, LeaseModification } from '../types';
import {
  leaseStatusConfig,
  leaseTypeLabels,
  assetClassLabels,
  paymentFrequencyLabels,
  modificationTypeLabels,
} from '../types';

// ─── Detail Header ──────────────────────────────────────────────────────────

export function LeaseDetailHeader({ lease }: { lease: LeaseContract }) {
  const status = leaseStatusConfig[lease.status];
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-muted-foreground">{lease.leaseNumber}</div>
        <h2 className="text-lg font-semibold">{lease.description || lease.assetDescription}</h2>
        <p className="text-sm text-muted-foreground">Lessor: {lease.lessorName}</p>
      </div>
      <Badge className={status.color}>{status.label}</Badge>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

export function LeaseOverview({ lease }: { lease: LeaseContract }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Lease Type" value={leaseTypeLabels[lease.leaseType]} />
      <Field label="Asset Class" value={assetClassLabels[lease.assetClass]} />
      <Field label="Asset" value={lease.assetDescription} />
      <Field label="Commencement" value={formatDate(lease.commencementDate)} />
      <Field label="End Date" value={formatDate(lease.endDate)} />
      <Field label="Lease Term" value={`${lease.leaseTerm} months`} />
      <Field label="Payment" value={`${formatCurrency(lease.paymentAmount, lease.currency)} ${paymentFrequencyLabels[lease.paymentFrequency]}`} />
      <Field label="IBR" value={`${lease.incrementalBorrowingRate}%`} />
      <Field label="Currency" value={lease.currency} />
      <Field label="ROU Asset Value" value={formatCurrency(lease.rouAssetValue, lease.currency)} />
      <Field label="Acc. Depreciation" value={formatCurrency(lease.accumulatedDepreciation, lease.currency)} />
      <Field label="Carrying Amount" value={formatCurrency(lease.carryingAmount, lease.currency)} />
      <Field label="Lease Liability" value={formatCurrency(lease.leaseLiabilityValue, lease.currency)} />
      <Field label="Current Liability" value={formatCurrency(lease.currentLiability, lease.currency)} />
      <Field label="Non-Current Liability" value={formatCurrency(lease.nonCurrentLiability, lease.currency)} />
      {lease.hasExtensionOption && <Field label="Extension" value={lease.extensionPeriod ? `${lease.extensionPeriod} months` : 'Yes'} />}
      {lease.hasTerminationOption && <Field label="Termination Penalty" value={lease.terminationPenalty ? formatCurrency(lease.terminationPenalty, lease.currency) : 'Yes'} />}
      {lease.hasPurchaseOption && <Field label="Purchase Price" value={lease.purchasePrice ? formatCurrency(lease.purchasePrice, lease.currency) : 'Yes'} />}
    </div>
  );
}

// ─── Payment Schedule Tab ───────────────────────────────────────────────────

export function LeasePaymentSchedule({ entries }: { entries: LeaseScheduleEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No schedule entries.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Lease payment schedule</caption>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Opening</TableHead>
            <TableHead className="text-right">Payment</TableHead>
            <TableHead className="text-right">Interest</TableHead>
            <TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Closing</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id} tabIndex={0}>
              <TableCell className="text-muted-foreground">{e.periodNumber}</TableCell>
              <TableCell>{formatDate(e.dueDate)}</TableCell>
              <TableCell className="font-mono text-right">{e.openingBalance.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{e.payment.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{e.interestExpense.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{e.principalReduction.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{e.closingBalance.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={e.isPaid ? 'default' : 'outline'}>
                  {e.isPaid ? 'Paid' : 'Pending'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Modifications Tab ──────────────────────────────────────────────────────

export function LeaseModificationsTable({ modifications }: { modifications: LeaseModification[] }) {
  if (modifications.length === 0) {
    return <p className="text-sm text-muted-foreground">No modifications recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Lease modifications</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Modification #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Effective Date</TableHead>
            <TableHead className="text-right">ROU Adj.</TableHead>
            <TableHead className="text-right">Liability Adj.</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modifications.map((m) => (
            <TableRow key={m.id} tabIndex={0}>
              <TableCell className="font-mono">{m.modificationNumber}</TableCell>
              <TableCell>{modificationTypeLabels[m.modificationType]}</TableCell>
              <TableCell>{formatDate(m.effectiveDate)}</TableCell>
              <TableCell className="font-mono text-right">{m.rouAdjustment.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{m.liabilityAdjustment.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{m.gainOrLoss.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Field Helper ───────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
