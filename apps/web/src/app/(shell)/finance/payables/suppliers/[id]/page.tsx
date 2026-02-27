import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getRequestContext } from '@/lib/auth';
import { getSupplier } from '@/features/finance/payables/queries/ap-supplier.queries';
import { ApSupplierDetailHeader } from '@/features/finance/payables/blocks/ap-supplier-detail-header';
import { ApSupplierSitesTable } from '@/features/finance/payables/blocks/ap-supplier-sites-table';
import { ApSupplierBankAccounts } from '@/features/finance/payables/blocks/ap-supplier-bank-accounts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getSupplier(ctx, id);
  if (!result.ok) return { title: 'Supplier | Payables' };
  const supplier = result.value;
  return {
    title: `${supplier.name} | Suppliers | Payables`,
    description: `Supplier ${supplier.name} — ${supplier.sites.length} site(s), ${supplier.invoiceCount} invoice(s)`,
  };
}

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getSupplier(ctx, id);

  if (!result.ok) notFound();
  const supplier = result.value;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={routes.finance.suppliers}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Suppliers</span>
      </div>

      <ApSupplierDetailHeader supplier={supplier} />

      <Tabs defaultValue="sites">
        <TabsList>
          <TabsTrigger value="sites">Sites ({supplier.sites.length})</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts ({supplier.bankAccounts.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({supplier.invoiceCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="sites" className="mt-4">
          <ApSupplierSitesTable sites={supplier.sites} />
        </TabsContent>
        <TabsContent value="bank-accounts" className="mt-4">
          <ApSupplierBankAccounts accounts={supplier.bankAccounts} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Invoice list for this supplier will load here. View all invoices on the{' '}
            <Link href={`${routes.finance.payables}?supplierId=${supplier.id}`} className="text-primary hover:underline">
              payables page
            </Link>.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
