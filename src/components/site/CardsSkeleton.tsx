/**
 * Placeholder with roughly the final height, so streamed content doesn't shift the
 * layout (CLS). Announced once to assistive tech via the status role.
 */
export function CardsSkeleton({
  label,
  rows,
  compact = false,
}: {
  label: string;
  rows: number;
  compact?: boolean;
}) {
  return (
    <div role="status" aria-label={label}>
      <ul className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className={`animate-pulse rounded border border-base-300 bg-base-200 ${compact ? "h-16" : "h-44"}`}
          />
        ))}
      </ul>
    </div>
  );
}
