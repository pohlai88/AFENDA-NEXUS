import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { routes } from '@/lib/constants';

export default function PortalCaseNotFound() {
  return (
    <main className="flex page-min-h flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">Case not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The case you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href={routes.portal.cases}>Back to Cases</Link>
      </Button>
    </main>
  );
}
