type AdminTableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export default function AdminTableSkeleton({
  rows = 5,
  columns = 4
}: AdminTableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/15 bg-white/[0.03] p-3">
      <div className="space-y-2">
        <div className="h-9 animate-pulse rounded-md bg-white/[0.08]" />
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`admin-row-${rowIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, colIndex) => (
              <div
                key={`admin-cell-${rowIndex}-${colIndex}`}
                className="h-8 animate-pulse rounded bg-white/[0.06]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
