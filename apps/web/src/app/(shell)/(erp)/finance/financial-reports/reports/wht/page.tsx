import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { getRequestContext } from '@/lib/auth';
import {
  getWhtCertificates,
  getWhtReportSummary,
} from '@/features/finance/payables/queries/ap-wht.queries';
import { ApWhtCertificateTable } from '@/features/finance/payables/blocks/ap-wht-certificate-table';
import { ApWhtSummary } from '@/features/finance/payables/blocks/ap-wht-summary';
import { Pagination } from '@/components/erp/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Reports — Wht' };

const PAGE_SIZE = 20;

function buildHref(taxYear: string | undefined, supplierId: string | undefined, nextPage: number) {
  const sp = new URLSearchParams();
  if (taxYear) sp.set('taxYear', taxYear);
  if (supplierId) sp.set('supplierId', supplierId);
  sp.set('page', String(nextPage));
  return `${routes.finance.whtReport}?${sp.toString()}`;
}

async function WhtReportContent({
  ctx,
  taxYear,
  supplierId,
  page,
}: {
  ctx: RequestContext;
  taxYear: string | undefined;
  supplierId: string | undefined;
  page: string;
}) {
  const [certResult, summaryResult] = await Promise.all([
    getWhtCertificates(ctx, { taxYear, supplierId, page, limit: String(PAGE_SIZE) }),
    getWhtReportSummary(ctx, { taxYear }),
  ]);
  const certs = certResult.ok ? certResult.value.data : [];
  const total = certResult.ok ? certResult.value.total : 0;
  const currentPage = certResult.ok ? certResult.value.page : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Withholding Tax Report</h1>
        <p className="text-sm text-muted-foreground">
          WHT certificates issued to suppliers, grouped by income type.
        </p>
      </div>

      <form className="flex items-center gap-3" action={routes.finance.whtReport} method="GET">
        <Input
          name="taxYear"
          type="number"
          defaultValue={taxYear ?? new Date().getFullYear()}
          min={2000}
          max={2100}
          className="w-32"
          placeholder="Tax year"
          aria-label="Tax year"
        />
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
      </form>

      {summaryResult.ok && <ApWhtSummary summary={summaryResult.value} />}

      <Suspense fallback={<TableSkeleton />}>
        <ApWhtCertificateTable data={certs} />
      </Suspense>

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalCount={total}
        buildHref={(nextPage) => buildHref(taxYear, supplierId, nextPage)}
      />
    </div>
  );
}

export default async function WhtReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const taxYear = typeof params.taxYear === 'string' ? params.taxYear : undefined;
  const supplierId = typeof params.supplierId === 'string' ? params.supplierId : undefined;
  const page = typeof params.page === 'string' ? params.page : '1';

  const ctx = await getRequestContext();

  return (
    <Suspense>
      <WhtReportContent ctx={ctx} taxYear={taxYear} supplierId={supplierId} page={page} />
    </Suspense>
  );
}
