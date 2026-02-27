import { Suspense } from 'react';
import Link from 'next/link';
import { getRequestContext } from '@/lib/auth';
import { getSuppliers } from '@/features/finance/payables/queries/ap-supplier.queries';
import { ApSupplierTable } from '@/features/finance/payables/blocks/ap-supplier-table';
import { Pagination } from '@/components/erp/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { routes } from '@/lib/constants';
import { Plus } from 'lucide-react';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'ON_HOLD', 'INACTIVE'] as const;
const PAGE_SIZE = 20;

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const q = typeof params.q === 'string' ? params.q : undefined;
  const page = typeof params.page === 'string' ? params.page : '1';

  const ctx = await getRequestContext();
  const result = await getSuppliers(ctx, {
    status: status === 'ALL' ? undefined : status,
    q,
    page,
    limit: String(PAGE_SIZE),
  });

  const suppliers = result.ok ? result.value.data : [];
  const total = result.ok ? result.value.total : 0;
  const currentPage = result.ok ? result.value.page : 1;

  function buildHref(nextPage: number) {
    const sp = new URLSearchParams();
    if (status && status !== 'ALL') sp.set('status', status);
    if (q) sp.set('q', q);
    sp.set('page', String(nextPage));
    return `${routes.finance.suppliers}?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage supplier master data, sites, and bank accounts.
          </p>
        </div>
        <Button asChild>
          <Link href={routes.finance.supplierNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Supplier
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const isActive = (s === 'ALL' && !status) || status === s;
            const sp = new URLSearchParams();
            if (s !== 'ALL') sp.set('status', s);
            if (q) sp.set('q', q);
            return (
              <Link key={s} href={`${routes.finance.suppliers}?${sp.toString()}`}>
                <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer">
                  {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').charAt(0) + s.replace(/_/g, ' ').slice(1).toLowerCase()}
                </Badge>
              </Link>
            );
          })}
        </div>

        <form className="ml-auto flex gap-2" action={routes.finance.suppliers} method="GET">
          {status && status !== 'ALL' && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q} placeholder="Search suppliers…" className="w-64" />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ApSupplierTable data={suppliers} />
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
