import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

/**
 * Loading state for auth pages
 *
 * Displays while auth pages are being rendered.
 * Uses consistent loading skeleton from ERP components.
 */
export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSkeleton variant="form" />
    </div>
  );
}
