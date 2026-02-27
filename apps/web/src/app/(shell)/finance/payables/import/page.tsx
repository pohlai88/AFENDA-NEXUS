import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/constants';
import { ApBatchImportForm } from '@/features/finance/payables/forms/ap-batch-import-form';

export default function BatchImportPage() {
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
          <CardTitle>Batch Invoice Import</CardTitle>
          <CardDescription>
            Import multiple AP invoices at once via CSV data. Each row is validated individually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApBatchImportForm />
        </CardContent>
      </Card>
    </div>
  );
}
