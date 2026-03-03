import { DetailSkeleton } from '@/components/erp/loading-skeleton';

export default function ArCollectionsLoading() {
  return (
    <div
      className="container max-w-5xl space-y-6 py-8"
      role="status"
      aria-label="Loading documentation"
    >
      <DetailSkeleton />
      <DetailSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
