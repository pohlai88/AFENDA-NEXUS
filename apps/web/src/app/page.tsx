import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Home',
  description: 'Enterprise-grade multi-tenant ERP platform for modern finance teams',
};

export default async function RootPage() {
  const session = await getServerSession();

  if (session) {
    // Authenticated → finance dashboard
    redirect('/finance');
  }

  // Unauthenticated → login
  redirect('/login');
}
