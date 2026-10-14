import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="shell py-12 lg:py-16">
      <Skeleton className="h-3 w-16 rounded-none" />
      <Skeleton className="mt-3 h-10 w-56 rounded-none" />
      <div className="mb-10 mt-10 flex gap-6 border-b border-border pb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-14 rounded-none" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <Skeleton className="h-3 w-20 rounded-none" />
            <Skeleton className="h-4 w-32 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
