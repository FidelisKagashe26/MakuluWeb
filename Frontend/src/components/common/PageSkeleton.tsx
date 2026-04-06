export default function PageSkeleton() {
  return (
    <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/75">
      <div className="h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`page-skeleton-${index}`}
            className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]"
          />
        ))}
      </div>
    </section>
  );
}
