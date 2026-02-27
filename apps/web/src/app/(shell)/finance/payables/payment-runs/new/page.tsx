import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { ApPaymentRunForm } from '@/features/finance/payables/forms/ap-payment-run-form';

export default function NewPaymentRunPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={routes.finance.paymentRuns}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Payment Runs</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Payment Run</CardTitle>
          <CardDescription>
            Create a new batch payment run for approved invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApPaymentRunForm />
        </CardContent>
      </Card>
    </div>
  );
}
