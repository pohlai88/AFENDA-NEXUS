import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { ApBankRejectionForm } from '@/features/finance/payables/blocks/ap-bank-rejection-form';

export const metadata = { title: 'Payables — Payment Runs — Rejection' };

export default async function BankRejectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={routes.finance.paymentRunDetail(id)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Bank Rejection</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Bank Rejection</CardTitle>
          <CardDescription>
            Record a bank rejection for this payment run. This will reverse the
            affected payments and reopen the associated invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApBankRejectionForm runId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
