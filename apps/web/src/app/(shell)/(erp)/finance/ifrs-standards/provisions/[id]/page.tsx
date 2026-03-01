import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getProvisionById, getProvisionMovements } from '@/features/finance/provisions/queries/provisions.queries';
import { ProvisionDetailHeader, ProvisionOverview, ProvisionMovementsList } from '@/features/finance/provisions/blocks/provision-detail';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getProvisionById(ctx, id);
  if (!result.ok) return { title: 'Provision | Finance' };
  return { title: `${result.value.provisionNumber} | Provisions` };
}

async function MovementsSection({ provisionId }: { provisionId: string }) {
  const ctx = await getRequestContext();
  const result = await getProvisionMovements(ctx, provisionId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error.message}</p>;
  return <ProvisionMovementsList movements={result.value.data} />;
}

export default async function ProvisionDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getProvisionById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load provision');
  }

  const provision = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${provision.provisionNumber} — ${provision.name}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Provisions', href: routes.finance.provisions },
          { label: provision.provisionNumber },
        ]}
      />
      <BusinessDocument
        header={<ProvisionDetailHeader provision={provision} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <ProvisionOverview provision={provision} /> },
          {
            value: 'movements',
            label: 'Movements',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <MovementsSection provisionId={provision.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
