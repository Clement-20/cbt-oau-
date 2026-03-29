import React from "react";
import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx(
      "animate-pulse bg-black/5 dark:bg-white/5 rounded-2xl",
      className
    )} />
  );
}

export function ResourceCardSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-3xl border-[var(--border)] flex flex-col justify-between h-[280px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-16 h-6 rounded-lg" />
          </div>
          <Skeleton className="w-8 h-4 rounded-full" />
        </div>
        <Skeleton className="w-full h-6 rounded-lg mb-2" />
        <Skeleton className="w-2/3 h-6 rounded-lg mb-4" />
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="w-20 h-2 rounded-full" />
            <Skeleton className="w-24 h-3 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-2xl">
        <div className="flex gap-4">
          <Skeleton className="w-12 h-4 rounded-full" />
          <Skeleton className="w-12 h-4 rounded-full" />
        </div>
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <ResourceCardSkeleton key={i} />
      ))}
    </div>
  );
}
