import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mb-2 h-5 w-11/12" />
      <Skeleton className="mb-1.5 h-3.5 w-full" />
      <Skeleton className="mb-4 h-3.5 w-9/12" />
      <div className="flex gap-2 border-t pt-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border bg-card p-4 shadow-soft', className)}>
      <Skeleton className="mb-2 h-4 w-1/3" />
      <Skeleton className="mb-1.5 h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 shadow-card">
          <Skeleton className="mb-2 h-5 w-5 rounded" />
          <Skeleton className="mb-1 h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function PollCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-card sm:p-5">
      <div className="mb-3 flex gap-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="mb-4 h-5 w-11/12" />
      <Skeleton className="mb-2 h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Skeleton className="mb-6 h-4 w-24" />
      <Skeleton className="mb-4 h-52 w-full rounded-2xl" />
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="mb-3 h-6 w-24 rounded-md" />
      <Skeleton className="mb-3 h-7 w-11/12" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-6 h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="container max-w-md py-16 sm:py-20 text-center">
      <Skeleton className="mx-auto mb-4 h-14 w-14 rounded-2xl" />
      <Skeleton className="mx-auto mb-2 h-6 w-56" />
      <Skeleton className="mx-auto mb-5 h-4 w-72" />
      <Skeleton className="mx-auto h-11 w-40 rounded-xl" />
    </div>
  );
}
