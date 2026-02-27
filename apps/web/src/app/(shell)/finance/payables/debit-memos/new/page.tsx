import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { ApDebitMemoForm } from '@/features/finance/payables/forms/ap-debit-memo-form';
import { createDebitMemoAction } from '@/features/finance/payables/actions/ap-capture.actions';

export default function NewDebitMemoPage() {
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
          <CardTitle>New Debit Memo</CardTitle>
          <CardDescription>
            Create a debit memo to adjust an existing AP invoice upward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApDebitMemoForm onSubmit={createDebitMemoAction} />
        </CardContent>
      </Card>
    </div>
  );
}
