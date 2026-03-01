import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalBankAccounts } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalBankAccountList } from '@/features/portal/blocks/portal-bank-account-list';
import { PortalBankAccountForm } from '@/features/portal/forms/portal-bank-account-form';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export default async function PortalBankAccountsPage() {
  const ctx = await getRequestContext();

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
  const result = await getPortalBankAccounts(ctx, supplier.supplierId);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Bank Accounts"
        description="Manage your bank accounts for payment processing."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Bank Accounts' },
        ]}
      />

      {result.ok ? (
        <PortalBankAccountList data={result.value} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}

      <PortalBankAccountForm supplierId={supplier.supplierId} />
    </div>
    </Suspense>
  );
}
