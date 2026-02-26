import { Skeleton } from '@/components/ui/skeleton';

export default function IncomeStatementLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="rounded-md border">
          <div className="border-b p-4">
            <Skeleton className="h-4 w-32" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      ))}
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
