/**
 * Suspense fallback for data-driven pages. The min-height keeps the footer below the
 * fold while content streams in, so nothing visible jumps (CLS).
 */
export function PageFallback({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="min-h-[85vh]">
      <div aria-hidden="true" className="space-y-4">
        <div className="h-4 w-40 animate-pulse rounded bg-base-200" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-base-200" />
        <div className="h-24 animate-pulse rounded bg-base-200" />
      </div>
    </div>
  );
}
