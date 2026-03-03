import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { RequestContext } from '@afenda/core';
import { getRequestContext } from '@/lib/auth';
import { getSupplier } from '@/features/finance/payables/queries/ap-supplier.queries';
import { ApSupplierDetailHeader } from '@/features/finance/payables/blocks/ap-supplier-detail-header';
import { ApSupplierSitesTable } from '@/features/finance/payables/blocks/ap-supplier-sites-table';
import { ApSupplierBankAccounts } from '@/features/finance/payables/blocks/ap-supplier-bank-accounts';
import {
  ContactsTab,
  TaxRegistrationsTab,
  LegalDocsTab,
  BlocksTab,
  RiskTab,
  EvaluationsTab,
  DiversityTab,
  CompanyOverridesTab,
} from '@/features/finance/payables/blocks/supplier-mdm-tabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getSupplier(ctx, id);
  if (!result.ok) return { title: 'Supplier | Payables' };
  return { title: `${result.value.name} | Suppliers | Payables` };
}

async function SupplierDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getSupplier(ctx, id);
  if (!result.ok) notFound();
  const s = result.value;

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

      <ApSupplierDetailHeader supplier={s} />

      <Tabs defaultValue="sites">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="sites">Sites ({s.sites.length})</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts ({s.bankAccounts.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="tax">Tax Registrations</TabsTrigger>
          <TabsTrigger value="legal-docs">Legal Docs</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="diversity">Diversity</TabsTrigger>
          <TabsTrigger value="overrides">Company Overrides</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({s.invoiceCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="sites" className="mt-4">
          <ApSupplierSitesTable sites={s.sites} />
        </TabsContent>
        <TabsContent value="bank-accounts" className="mt-4">
          <ApSupplierBankAccounts accounts={s.bankAccounts} />
        </TabsContent>
        <TabsContent value="contacts" className="mt-4">
          <ContactsTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="tax" className="mt-4">
          <TaxRegistrationsTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="legal-docs" className="mt-4">
          <LegalDocsTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="blocks" className="mt-4">
          <BlocksTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="risk" className="mt-4">
          <RiskTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="evaluations" className="mt-4">
          <EvaluationsTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="diversity" className="mt-4">
          <DiversityTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="overrides" className="mt-4">
          <CompanyOverridesTab supplierId={s.id} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Invoice list for this supplier will load here. View all invoices on the{' '}
            <Link
              href={`${routes.finance.payables}?supplierId=${s.id}`}
              className="text-primary hover:underline"
            >
              payables page
            </Link>
            .
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function SupplierDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SupplierDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
