import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalInvoiceDetail,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, Clock, FileText, Package, ShoppingCart } from 'lucide-react';
import { routes } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { RequestContext } from '@afenda/core';

export const metadata = { title: '3-Way Match Resolution — Afenda Portal' };

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Match Column ──────────────────────────────────────────────────────────────

function MatchStatus({ matched }: { matched: boolean | null }) {
  if (matched === null) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }
  return matched ? (
    <Badge variant="secondary" className="gap-1 text-green-700 bg-green-50">
      <CheckCircle2 className="h-3 w-3" />
      Matched
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Discrepancy
    </Badge>
  );
}

interface FieldRowProps {
  label: string;
  apValue?: string | null;
  supplierValue?: string | null;
  grValue?: string | null;
  poValue?: string | null;
}

function FieldRow({ label, apValue, supplierValue, grValue, poValue }: FieldRowProps) {
  const hasDiscrepancy = apValue != null && supplierValue != null && apValue !== supplierValue;

  return (
    <div
      className={cn(
        'grid grid-cols-5 gap-x-4 py-2 text-sm',
        hasDiscrepancy && 'bg-red-50/60 -mx-4 px-4 rounded'
      )}
    >
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className={cn('font-mono', hasDiscrepancy && 'text-red-700 font-semibold')}>
        {apValue ?? '—'}
      </span>
      <span className={cn('font-mono', hasDiscrepancy && 'text-amber-700')}>
        {supplierValue ?? '—'}
      </span>
      <span className="font-mono text-muted-foreground/60 italic">{grValue ?? 'N/A'}</span>
      <span className="font-mono text-muted-foreground/60 italic">{poValue ?? 'N/A'}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

async function InvoiceResolutionPageContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;
  const result = await getPortalInvoiceDetail(ctx, supplier.supplierId, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Error loading invoice</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.error.message}</p>
      </div>
    );
  }

  const invoice = result.value;

  // Determine discrepancies (AP vs supplier-supplied data)
  const amountMatch =
    invoice.totalAmount != null && invoice.supplierTotalAmount != null
      ? invoice.totalAmount === invoice.supplierTotalAmount
      : null;

  const columns = [
    {
      key: 'ap',
      label: 'AP System',
      Icon: FileText,
      description: 'Data as entered by AP team',
      variant: 'blue' as const,
    },
    {
      key: 'supplier',
      label: 'Supplier Portal',
      Icon: FileText,
      description: 'Data as submitted by supplier',
      variant: 'gray' as const,
    },
    {
      key: 'gr',
      label: 'Goods Receipt',
      Icon: Package,
      description: 'P3: GR matching — coming soon',
      variant: 'muted' as const,
    },
    {
      key: 'po',
      label: 'Purchase Order',
      Icon: ShoppingCart,
      description: 'P3: PO matching — coming soon',
      variant: 'muted' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="3-Way Match Resolution"
        description={`Invoice ${invoice.invoiceNumber} — side-by-side comparison across all data sources.`}
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Invoices', href: routes.portal.invoices },
          { label: invoice.invoiceNumber, href: routes.portal.invoiceDetail(id) },
          { label: 'Resolution' },
        ]}
      />

      {/* Column headers */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => {
          const Icon = col.Icon;
          const isMuted = col.variant === 'muted';
          return (
            <Card
              key={col.key}
              className={cn(
                'border',
                isMuted && 'opacity-60',
                col.variant === 'blue' && 'border-blue-200 bg-blue-50/30'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn('h-4 w-4', isMuted ? 'text-muted-foreground' : 'text-blue-600')}
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm font-semibold">{col.label}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">{col.description}</p>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Match summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Match Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between rounded-lg border px-4 py-2">
            <span className="text-sm font-medium">AP ↔ Supplier match</span>
            <MatchStatus matched={amountMatch} />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-2 opacity-50">
            <span className="text-sm font-medium">AP ↔ Goods Receipt</span>
            <MatchStatus matched={null} />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-2 opacity-50">
            <span className="text-sm font-medium">AP ↔ Purchase Order</span>
            <MatchStatus matched={null} />
          </div>
        </CardContent>
      </Card>

      {/* 4-column field comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Field Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Column headers */}
          <div className="grid grid-cols-5 gap-x-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Field</span>
            <span className="text-blue-700">AP System</span>
            <span>Supplier</span>
            <span className="text-muted-foreground/60">GR (P3)</span>
            <span className="text-muted-foreground/60">PO (P3)</span>
          </div>
          <Separator className="mb-3" />
          <FieldRow
            label="Invoice No."
            apValue={invoice.invoiceNumber}
            supplierValue={invoice.supplierRef ?? invoice.invoiceNumber}
          />
          <FieldRow
            label="Invoice Date"
            apValue={
              invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : null
            }
            supplierValue={
              invoice.supplierInvoiceDate
                ? new Date(invoice.supplierInvoiceDate).toLocaleDateString()
                : null
            }
          />
          <FieldRow
            label="Due Date"
            apValue={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : null}
            supplierValue={null}
          />
          <FieldRow
            label="Total Amount"
            apValue={invoice.totalAmount != null ? String(invoice.totalAmount) : null}
            supplierValue={
              invoice.supplierTotalAmount != null ? String(invoice.supplierTotalAmount) : null
            }
          />
          <FieldRow
            label="Currency"
            apValue={invoice.currency ?? null}
            supplierValue={invoice.supplierCurrency ?? null}
          />
          <FieldRow
            label="PO Ref"
            apValue={invoice.poRef ?? null}
            supplierValue={invoice.supplierPoRef ?? null}
          />
          <FieldRow label="Status" apValue={invoice.status} supplierValue={null} />
        </CardContent>
      </Card>

      {/* Line items */}
      {invoice.lines && invoice.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Line Items — AP View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Invoice line items comparison</caption>
                <thead>
                  <tr className="border-b text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 text-left">#</th>
                    <th className="pb-2 text-left">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line, i) => (
                    <tr key={`line-${i}`} className="border-b last:border-0">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2">{line.description ?? '—'}</td>
                      <td className="py-2 text-right">{line.quantity}</td>
                      <td className="py-2 text-right font-mono">{String(line.unitPrice ?? '—')}</td>
                      <td className="py-2 text-right font-mono">{String(line.amount ?? '—')}</td>
                      <td className="py-2 text-right font-mono">{String(line.taxAmount ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GR + PO placeholder cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Goods Receipt (P3)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Goods receipt matching will be implemented in CAP-MATCH Phase 3. This panel will show
              GR document data for 3-way matching.
            </p>
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Purchase Order (P3)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              PO matching will be implemented in CAP-MATCH Phase 3. This panel will link to the
              originating purchase order and compare quantities and pricing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function PortalInvoiceResolutionPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <InvoiceResolutionPageContent ctx={ctx} id={id} />
    </Suspense>
  );
}
