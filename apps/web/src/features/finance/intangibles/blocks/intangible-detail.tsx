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
import type { IntangibleAsset, AmortizationScheduleEntry, ImpairmentTest } from '../types';
import {
  intangibleStatusConfig,
  intangibleTypeLabels,
  amortizationMethodLabels,
  impairmentResultLabels,
} from '../types';

// ─── Detail Header ──────────────────────────────────────────────────────────

export function IntangibleDetailHeader({ asset }: { asset: IntangibleAsset }) {
  const status = intangibleStatusConfig[asset.status];
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-muted-foreground">{asset.assetNumber}</div>
        <h2 className="text-lg font-semibold">{asset.name}</h2>
        <p className="text-sm text-muted-foreground">{asset.description}</p>
      </div>
      <Badge className={status.color}>{status.label}</Badge>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

export function IntangibleOverview({ asset }: { asset: IntangibleAsset }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Type" value={intangibleTypeLabels[asset.intangibleType]} />
      <Field label="Category" value={asset.categoryName} />
      <Field label="Amortization Method" value={amortizationMethodLabels[asset.amortizationMethod]} />
      <Field label="Original Cost" value={formatCurrency(asset.originalCost, asset.currency)} />
      <Field label="Residual Value" value={formatCurrency(asset.residualValue, asset.currency)} />
      <Field label="Carrying Amount" value={formatCurrency(asset.carryingAmount, asset.currency)} />
      <Field label="Acc. Amortization" value={formatCurrency(asset.accumulatedAmortization, asset.currency)} />
      <Field label="Impairment Loss" value={formatCurrency(asset.impairmentLoss, asset.currency)} />
      <Field label="Useful Life" value={asset.hasIndefiniteLife ? 'Indefinite' : `${asset.usefulLifeMonths} months`} />
      <Field label="Acquisition Date" value={formatDate(asset.acquisitionDate)} />
      <Field label="Amortization Start" value={formatDate(asset.amortizationStartDate)} />
      <Field label="Expiry Date" value={asset.expiryDate ? formatDate(asset.expiryDate) : '—'} />
      {asset.patentNumber && <Field label="Patent Number" value={asset.patentNumber} />}
      {asset.registrationNumber && <Field label="Registration #" value={asset.registrationNumber} />}
      {asset.vendorName && <Field label="Vendor" value={asset.vendorName} />}
      <Field label="Internally Generated" value={asset.isInternallyGenerated ? 'Yes (IAS 38)' : 'No'} />
      {asset.developmentPhase && <Field label="Development Phase" value={asset.developmentPhase} />}
    </div>
  );
}

// ─── Amortization Schedule Tab ──────────────────────────────────────────────

export function AmortizationSchedule({ entries }: { entries: AmortizationScheduleEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No amortization schedule entries.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Amortization schedule</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Accumulated</TableHead>
            <TableHead className="text-right">Carrying</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id} tabIndex={0}>
              <TableCell>{e.periodName}</TableCell>
              <TableCell className="font-mono text-right">{e.amortizationAmount.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{e.accumulatedAmortization.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{e.carryingAmount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={e.isPosted ? 'default' : 'outline'}>
                  {e.isPosted ? 'Posted' : 'Pending'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Impairment Tests Tab ───────────────────────────────────────────────────

export function ImpairmentTestsTable({ tests }: { tests: ImpairmentTest[] }) {
  if (tests.length === 0) {
    return <p className="text-sm text-muted-foreground">No impairment tests recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Impairment tests</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Test Date</TableHead>
            <TableHead className="text-right">Carrying Before</TableHead>
            <TableHead className="text-right">Recoverable</TableHead>
            <TableHead className="text-right">Loss</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((t) => (
            <TableRow key={t.id} tabIndex={0}>
              <TableCell>{formatDate(t.testDate)}</TableCell>
              <TableCell className="font-mono text-right">{t.carryingAmountBefore.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{t.recoverableAmount.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-right">{t.impairmentLoss.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="outline">{impairmentResultLabels[t.result]}</Badge>
              </TableCell>
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
