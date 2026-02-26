import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await getServerSession();

  if (session) {
    // Authenticated → shell dashboard
    redirect('/finance');
  }

  redirect('/login');
}
