import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalCases } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalCaseFilterBar } from '@/features/portal/blocks/portal-case-filter-bar';
import { Pagination } from '@/components/erp/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { AlertTriangle, Inbox } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/constants';
import { buildListHref } from '@/lib/build-list-href';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

const PAGE_SIZE = 20;

interface CasesPageProps {
  searchParams: Promise<{ page?: string; status?: string; q?: string; category?: string }>;
}

async function CasesPageContent({
  ctx,
  page,
  status,
  category,
  q,
}: {
  ctx: RequestContext;
  page: number;
  status?: string;
  category?: string;
  q?: string;
}) {
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
  const result = await getPortalCases(ctx, supplier.supplierId, {
    page: String(page),
    limit: '20',
    status,
    category,
    q,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases"
        description="Track and manage your support cases, disputes, and inquiries."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Cases' }]}
        actions={
          <Button asChild>
            <Link href={routes.portal.caseNew}>New Case</Link>
          </Button>
        }
      />

      <PortalCaseFilterBar currentStatus={status} currentCategory={category} currentSearch={q} />

      {result.ok && result.value.data.length > 0 ? (
        <>
          <div className="space-y-3">
            {result.value.data.map((c) => (
              <Link key={c.id} href={routes.portal.caseDetail(c.id)} className="block">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.ticketNumber}
                        </span>
                        <StatusBadge status={c.status} />
                        <Badge variant="outline" className="text-xs">
                          {c.priority}
                        </Badge>
                      </div>
                      <p className="truncate text-sm font-medium">{c.subject}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{c.category}</span>
                        <span>&middot;</span>
                        <DateCell date={c.createdAt} format="short" />
                        {c.assignedTo && (
                          <>
                            <span>&middot;</span>
                            <span>Assigned: {c.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={result.value.total}
            buildHref={(p) =>
              buildListHref(
                routes.portal.cases,
                {
                  status,
                  category,
                  q,
                },
                p
              )
            }
          />
        </>
      ) : result.ok ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-medium">No cases yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first case to get started.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href={routes.portal.caseNew}>New Case</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}

export default async function PortalCasesPage({ searchParams }: CasesPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const page = Number(params.page ?? '1');

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CasesPageContent
        ctx={ctx}
        page={page}
        status={params.status}
        category={params.category}
        q={params.q}
      />
    </Suspense>
  );
}
