import Link from 'next/link';
import { routes } from '@/lib/constants';

export default function MembersNotFound() {
  return (
    <main className="flex page-min-h flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Member Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The member you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href={routes.settingsMembers} className="mt-4 text-primary underline">
        Back to Members
      </Link>
    </main>
  );
}
