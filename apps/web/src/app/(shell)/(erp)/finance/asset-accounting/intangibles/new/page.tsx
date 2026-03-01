import { PageHeader } from '@/components/erp/page-header';
import { CreateIntangibleForm } from '@/features/finance/intangibles/forms/create-intangible-form';
import { createIntangibleAsset } from '@/features/finance/intangibles/actions/intangibles.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'New Intangible Asset | Finance' };

async function handleCreate(
  data: unknown
): Promise<{ ok: true; data: { id: string; assetNumber: string } } | { ok: false; error: string }> {
  'use server';
  return createIntangibleAsset(data as Parameters<typeof createIntangibleAsset>[0]);
}

export default function NewIntangiblePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Intangible Asset"
        description="Register a new intangible asset under IAS 38."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Intangibles', href: routes.finance.intangibles },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <CreateIntangibleForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
