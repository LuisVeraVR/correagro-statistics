"use client";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted",
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-border bg-card p-5">
        <div className="space-y-2">
          <Shimmer className="h-7 w-64" />
          <Shimmer className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-28 rounded-lg" />
          <Shimmer className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* KPI Skeletons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-8 w-8 rounded-lg" />
            </div>
            <Shimmer className="h-8 w-32" />
            <Shimmer className="h-2 w-20" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <Shimmer className="h-5 w-40" />
              <Shimmer className="h-4 w-16" />
            </div>
            <Shimmer className="h-64 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Rankings Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-4"
          >
            <Shimmer className="h-4 w-36" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Shimmer className="h-3 w-28" />
                  <Shimmer className="h-3 w-16" />
                </div>
                <Shimmer className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Shimmer className="h-5 w-48" />
        <div className="space-y-2">
          <Shimmer className="h-10 w-full rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
