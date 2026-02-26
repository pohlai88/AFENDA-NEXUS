import { Skeleton } from '@/components/ui/skeleton';

export default function CashFlowLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-md border p-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
