import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';

export default function LoginNotFound() {
  return (
    <main className="flex page-min-h flex-col items-center justify-center px-4 text-center">
      <h2 className="text-lg font-semibold">Page Not Found</h2>
      <Button asChild className="mt-4"><Link href={routes.login}>Back to Login</Link></Button>
    </main>
  );
}
