import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRequestContext } from '@/lib/auth';
import { getPaymentRun } from '@/features/finance/payables/queries/ap-payment-run.queries';
import { ApPaymentRunItemsTable } from '@/features/finance/payables/blocks/ap-payment-run-items-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';

export default async function PaymentRunItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getPaymentRun(ctx, id);

  if (!result.ok) notFound();
  const run = result.value;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={routes.finance.paymentRunDetail(id)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          {run.runNumber} — Items
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Invoices to Payment Run</CardTitle>
          <CardDescription>
            Select unpaid invoices to include in {run.runNumber}.
            Invoices must be approved and denominated in {run.currencyCode}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {run.items.length > 0 ? (
            <ApPaymentRunItemsTable items={run.items} currencyCode={run.currencyCode} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No items added yet. Use the invoice selector below to add invoices.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
