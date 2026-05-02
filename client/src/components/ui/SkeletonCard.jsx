export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface-100 border border-surface-200 dark:border-surface-800 shadow-sm">
      <div className="h-48 bg-surface-200 dark:bg-surface-800 skeleton-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 rounded bg-surface-200 dark:bg-surface-800 skeleton-pulse" />
        <div className="h-4 w-1/2 rounded bg-surface-200 dark:bg-surface-800 skeleton-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-surface-200 dark:bg-surface-800 skeleton-pulse" />
          <div className="h-6 w-20 rounded-full bg-surface-200 dark:bg-surface-800 skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}
