import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { ApCreditMemoForm } from '@/features/finance/payables/forms/ap-credit-memo-form';
import { createCreditMemoAction } from '@/features/finance/payables/actions/ap-capture.actions';

export const metadata = { title: 'Payables — Credit Memos — New' };

export default function NewCreditMemoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={routes.finance.payables}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Payables</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Credit Memo</CardTitle>
          <CardDescription>
            Create a credit memo to offset an existing AP invoice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApCreditMemoForm onSubmit={createCreditMemoAction} />
        </CardContent>
      </Card>
    </div>
  );
}
