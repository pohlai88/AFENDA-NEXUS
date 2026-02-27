import { Suspense } from 'react';
import Link from 'next/link';
import { getRequestContext } from '@/lib/auth';
import { getHolds } from '@/features/finance/payables/queries/ap-hold.queries';
import { ApHoldTable } from '@/features/finance/payables/blocks/ap-hold-table';
import { Pagination } from '@/components/erp/pagination';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/constants';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'RELEASED'] as const;
const TYPE_OPTIONS = ['ALL', 'DUPLICATE', 'MATCH_EXCEPTION', 'VALIDATION', 'APPROVAL', 'FX_RATE', 'MANUAL'] as const;
const PAGE_SIZE = 20;

export default async function HoldsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const holdType = typeof params.holdType === 'string' ? params.holdType : undefined;
  const supplierId = typeof params.supplierId === 'string' ? params.supplierId : undefined;
  const fromDate = typeof params.fromDate === 'string' ? params.fromDate : undefined;
  const toDate = typeof params.toDate === 'string' ? params.toDate : undefined;
  const page = typeof params.page === 'string' ? params.page : '1';

  const ctx = await getRequestContext();
  const result = await getHolds(ctx, {
    status: status === 'ALL' ? undefined : status,
    holdType: holdType === 'ALL' ? undefined : holdType,
    supplierId,
    fromDate,
    toDate,
    page,
    limit: String(PAGE_SIZE),
  });

  const holds = result.ok ? result.value.data : [];
  const total = result.ok ? result.value.total : 0;
  const currentPage = result.ok ? result.value.page : 1;

  function buildHref(nextPage: number) {
    const sp = new URLSearchParams();
    if (status && status !== 'ALL') sp.set('status', status);
    if (holdType && holdType !== 'ALL') sp.set('holdType', holdType);
    if (supplierId) sp.set('supplierId', supplierId);
    if (fromDate) sp.set('fromDate', fromDate);
    if (toDate) sp.set('toDate', toDate);
    sp.set('page', String(nextPage));
    return `${routes.finance.holds}?${sp.toString()}`;
  }

  function filterHref(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const s = overrides.status ?? status;
    const t = overrides.holdType ?? holdType;
    if (s && s !== 'ALL') sp.set('status', s);
    if (t && t !== 'ALL') sp.set('holdType', t);
    if (supplierId) sp.set('supplierId', supplierId);
    if (fromDate) sp.set('fromDate', fromDate);
    if (toDate) sp.set('toDate', toDate);
    return `${routes.finance.holds}?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Holds</h1>
        <p className="text-sm text-muted-foreground">
          View and manage holds on AP invoices.
        </p>
      </div>

      {/* Status filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const isActive = (s === 'ALL' && !status) || status === s;
            return (
              <Link key={s} href={filterHref({ status: s })}>
                <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer">
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Type filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Hold Type</p>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((t) => {
            const isActive = (t === 'ALL' && !holdType) || holdType === t;
            return (
              <Link key={t} href={filterHref({ holdType: t })}>
                <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer text-xs">
                  {t === 'ALL' ? 'All' : t.replace(/_/g, ' ')}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ApHoldTable data={holds} />
      </Suspense>

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalCount={total}
        buildHref={buildHref}
      />
    </div>
  );
}
