import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { ApSupplierReconForm } from '@/features/finance/payables/forms/ap-supplier-recon-form';

export const metadata = { title: 'Payables — Reconciliation' };

export default function SupplierReconciliationPage() {
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
          <CardTitle>Supplier Statement Reconciliation</CardTitle>
          <CardDescription>
            Compare supplier statement lines against AP records to identify discrepancies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApSupplierReconForm />
        </CardContent>
      </Card>
    </div>
  );
}
