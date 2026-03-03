import { Suspense } from 'react';
import Link from 'next/link';
import type { RequestContext } from '@afenda/core';
import { getRequestContext } from '@/lib/auth';
import { getSuppliers } from '@/features/finance/payables/queries/ap-supplier.queries';
import { ApSupplierTable } from '@/features/finance/payables/blocks/ap-supplier-table';
import { SupplierFilters } from '@/features/finance/payables/blocks/supplier-filters';
import { Pagination } from '@/components/erp/pagination';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import { Plus } from 'lucide-react';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Payables — Suppliers' };

const PAGE_SIZE = 20;

interface SuppliersContentProps {
  ctx: RequestContext;
  status?: string;
  q?: string;
  page: string;
}

async function SuppliersContent({ ctx, status, q, page }: SuppliersContentProps) {
  const result = await getSuppliers(ctx, {
    status: status === 'ALL' ? undefined : status,
    q,
    page,
    limit: String(PAGE_SIZE),
  });

  const suppliers = result.ok ? result.value.data : [];
  const total = result.ok ? result.value.total : 0;
  const currentPage = result.ok ? result.value.page : 1;

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

      <SupplierFilters currentStatus={status} q={q} />

      <ApSupplierTable data={suppliers} />

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalCount={total}
        buildHref={(nextPage) => {
          const sp = new URLSearchParams();
          if (status && status !== 'ALL') sp.set('status', status);
          if (q) sp.set('q', q);
          sp.set('page', String(nextPage));
          return `${routes.finance.suppliers}?${sp.toString()}`;
        }}
      />
    </div>
  );
}

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

  return (
    <Suspense fallback={<TableSkeleton />}>
      <SuppliersContent ctx={ctx} status={status} q={q} page={page} />
    </Suspense>
  );
}
