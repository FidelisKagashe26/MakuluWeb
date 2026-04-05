import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import AppDropdown from "@/components/common/AppDropdown";
import { useApiQuery } from "@/hooks/useApiQuery";
import { fetchPublicLeaders, type LeaderItem } from "@/services/adminService";

const rolePriority: Record<string, number> = {
  "Mchungaji Kiongozi": 1,
  "Mzee wa Kanisa": 2,
  "Katibu wa Kanisa": 3,
  "Mweka Hazina": 4
};

type SortOption = "priority" | "role-asc" | "role-desc";

const sortOptions = [
  { value: "priority", label: "Uongozi mkuu kwanza" },
  { value: "role-asc", label: "Role A-Z" },
  { value: "role-desc", label: "Role Z-A" }
];

export default function LeadersPage() {
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const { data, isLoading } = useApiQuery(
    () => fetchPublicLeaders({ page: 1, limit: 200, sort: "order" }),
    []
  );

  const sortedLeaders = useMemo(() => {
    const rows = [...(data?.data ?? [])];

    if (sortBy === "priority") {
      return rows.sort((a, b) => {
        const rankA = rolePriority[a.title] ?? 99;
        const rankB = rolePriority[b.title] ?? 99;
        return rankA - rankB;
      });
    }

    if (sortBy === "role-asc") {
      return rows.sort((a, b) => a.title.localeCompare(b.title));
    }

    return rows.sort((a, b) => b.title.localeCompare(a.title));
  }, [data?.data, sortBy]);

  return (
    <>
      <Helmet>
        <title>Viongozi | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="List ya viongozi wa kanisa pamoja na cheo na biography." />
      </Helmet>

      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Viongozi</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Viongozi wa Kanisa</h2>
          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Sorting (by role)
              <AppDropdown
                className="mt-1"
                value={sortBy}
                options={sortOptions}
                onChange={(value) => setSortBy(value as SortOption)}
              />
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`leader-loading-${index}`}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && sortedLeaders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/75 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-300">
            No data
          </div>
        ) : null}

        {!isLoading && sortedLeaders.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedLeaders.map((leader: LeaderItem) => (
              <article
                key={leader.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950"
              >
                {leader.imageUrl ? (
                  <img
                    src={leader.imageUrl}
                    alt={leader.name}
                    loading="lazy"
                    decoding="async"
                    className="h-56 w-full rounded-xl object-cover transition duration-300 group-hover:brightness-110"
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center rounded-xl bg-slate-200 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    No image
                  </div>
                )}
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{leader.name}</h3>
                <p className="text-sm font-semibold text-church-700 dark:text-church-300">{leader.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{leader.biography || "No data"}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
