import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Forbidden' };

export default function ForbiddenPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Denied"
        description="You do not have permission to access this resource."
        breadcrumbs={[{ label: 'Forbidden' }]}
      />

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your account is authenticated, but your current role or tenant scope does not allow
              this action.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
