import Link from 'next/link';

export default function OrganizationNotFound() {
  return (
    <main className="flex page-min-h flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Organization Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The organization you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/settings" className="mt-4 text-primary underline">
        Back to Settings
      </Link>
    </main>
  );
}
