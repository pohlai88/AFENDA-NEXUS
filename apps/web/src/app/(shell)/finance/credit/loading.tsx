import { Skeleton } from '@/components/ui/skeleton';

export default function CreditLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[260px]" />
          <Skeleton className="h-5 w-[360px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[160px]" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-[450px]" />
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    </div>
  );
}
