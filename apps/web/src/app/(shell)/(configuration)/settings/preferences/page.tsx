import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import { UserPreferencesSchema } from '@afenda/contracts';
import { PreferencesForm } from './_components/preferences-form';
import { ShortcutPreferencesCard } from './_components/shortcut-preferences-card';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Preferences' };

async function PreferencesContent({ ctx }: { ctx: RequestContext }) {
  const api = createApiClient(ctx);
  const result = await api.get<Record<string, unknown>>('/me/preferences');

  const preferences = UserPreferencesSchema.parse(result.ok ? result.value : {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferences"
        description="Customize your personal experience."
        breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Preferences' }]}
      />

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border p-6">
          <PreferencesForm preferences={preferences} />
        </div>
        <div className="rounded-lg border p-6">
          <ShortcutPreferencesCard />
        </div>
      </div>
    </div>
  );
}

export default async function PreferencesPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PreferencesContent ctx={ctx} />
    </Suspense>
  );
}
