import Link from 'next/link';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function SettingsAuditlogNotFound() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">Page Not Found</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        The audit log page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href={routes.home}>Back to Home</Link>
      </Button>
    </main>
  );
}
