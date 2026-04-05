export default function SectionSkeleton() {
  return (
    <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/70">
      <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-8 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-8 w-10/12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    </section>
  );
}
