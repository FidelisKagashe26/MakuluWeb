import { useEffect, useMemo, useState } from "react";
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
  const [searchValue, setSearchValue] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const { data, isLoading } = useApiQuery(
    () => fetchPublicLeaders({ page: 1, limit: 200, sort: "order" }),
    []
  );

  useEffect(() => {
    setFailedImageIds({});
  }, [data?.data]);

  const sortedLeaders = useMemo(() => {
    const normalizedSearch = submittedSearch.trim().toLowerCase();
    const rows = [...(data?.data ?? [])].filter((leader) => {
      if (!normalizedSearch) return true;
      return (
        String(leader.name || "").toLowerCase().includes(normalizedSearch) ||
        String(leader.title || "").toLowerCase().includes(normalizedSearch)
      );
    });

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
  }, [data?.data, sortBy, submittedSearch]);

  return (
    <>
      <Helmet>
        <title>Viongozi | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Orodha ya viongozi wa kanisa pamoja na majina na vyeo vyao." />
      </Helmet>

      <section className="space-y-5">
        <div className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-church-600 dark:text-church-300">
              VIONGOZI WA KANISA
            </p>
            <div className="w-full sm:w-64">
              <AppDropdown
                className="w-full"
                value={sortBy}
                options={sortOptions}
                onChange={(value) => setSortBy(value as SortOption)}
              />
            </div>
          </div>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
          <form
            className="mt-3 flex items-center justify-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedSearch(searchValue);
            }}
          >
            <input
              className="form-input w-full max-w-sm"
              placeholder="Search leader..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <button type="submit" className="admin-btn-primary px-4 py-2">
              Search
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedLeaders.map((leader: LeaderItem) => (
              <article
                key={leader.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950"
              >
                {leader.imageUrl && !failedImageIds[leader.id] ? (
                  <div className="w-full bg-slate-100 dark:bg-slate-900">
                    <img
                      src={leader.imageUrl}
                      alt={leader.name}
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setFailedImageIds((previous) => ({
                          ...previous,
                          [leader.id]: true
                        }))
                      }
                      className="block h-auto w-full"
                    />
                  </div>
                ) : (
                  <div className="flex h-60 w-full items-center justify-center bg-slate-200 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:h-64">
                    No image
                  </div>
                )}
                <div className="p-3 text-center">
                  <p className="text-sm font-semibold text-church-700 dark:text-church-300">{leader.title}</p>
                  <div className="mx-auto mt-1 h-px w-16 bg-slate-300/90 dark:bg-white/20" />
                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{leader.name}</h3>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
