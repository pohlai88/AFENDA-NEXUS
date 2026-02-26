import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getLedger } from '@/features/finance/ledgers/queries/ledger.queries';
import { routes } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Ledger Detail' };

interface LedgerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LedgerDetailPage({ params }: LedgerDetailPageProps) {
  const { id } = await params;
  const ctx = await getRequestContext();

  const result = await getLedger(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load ledger');
  }

  const ledger = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ledger.name}
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Ledgers', href: routes.finance.ledgers },
          { label: ledger.name },
        ]}
      />

      <div className="flex flex-wrap items-center gap-6 rounded-md border p-4">
        <div>
          <span className="text-xs text-muted-foreground">Name</span>
          <div className="mt-1 text-sm font-medium">{ledger.name}</div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Company</span>
          <div className="mt-1 text-sm font-medium">
            {ledger.companyName ?? ledger.companyId}
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-10 sm:block" />
        <div>
          <span className="text-xs text-muted-foreground">Base Currency</span>
          <div className="mt-1">
            <Badge variant="outline">{ledger.baseCurrency}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
