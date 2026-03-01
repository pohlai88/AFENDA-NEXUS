import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { ApSupplierForm } from '@/features/finance/payables/forms/ap-supplier-form';

export const metadata = { title: 'Payables — Suppliers — New' };

export default function NewSupplierPage() {
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

      <Card>
        <CardHeader>
          <CardTitle>New Supplier</CardTitle>
          <CardDescription>
            Register a new supplier in the accounts payable system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApSupplierForm />
        </CardContent>
      </Card>
    </div>
  );
}
