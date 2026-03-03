import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';

export default function PortalActivityNotFound() {
  return (
    <main className="flex page-min-h flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Activity Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The activity page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href={routes.portal.dashboard}>Back to Dashboard</Link>
      </Button>
    </main>
  );
}
