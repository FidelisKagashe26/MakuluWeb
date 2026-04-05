import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useApiQuery } from "@/hooks/useApiQuery";
import { fetchPublicDepartments } from "@/services/adminService";

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, isLoading } = useApiQuery(
    () => fetchPublicDepartments({ page: 1, limit: 300 }),
    []
  );

  const filteredDepartments = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const rows = data?.data ?? [];

    if (!query) {
      return rows;
    }

    return rows.filter((department) => {
      return (
        String(department.name || "").toLowerCase().includes(query) ||
        String(department.description || "").toLowerCase().includes(query)
      );
    });
  }, [data?.data, debouncedSearch]);

  const pageSize = 6;
  const totalPages = Math.max(Math.ceil(filteredDepartments.length / pageSize), 1);
  const pagedDepartments = filteredDepartments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <Helmet>
        <title>Idara Zote | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Orodha ya idara zote za kanisa pamoja na kamati na reports." />
      </Helmet>

      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Idara</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Orodha ya idara zote</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Tafuta idara kwa jina au maelezo.
          </p>

          <div className="mt-4">
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tafuta idara..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-100 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`department-loading-${index}`}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredDepartments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No data
          </div>
        ) : null}

        {!isLoading && filteredDepartments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pagedDepartments.map((department, index) => (
              <motion.article
                key={department.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-950"
              >
                {department.imageUrl ? (
                  <img
                    src={department.imageUrl}
                    alt={department.name}
                    loading="lazy"
                    decoding="async"
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-slate-200 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    No image
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{department.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{department.description || "No data"}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Kamati: {department.committee?.length ?? 0}
                  </p>
                  <Link
                    to={`/idara/${department.id}`}
                    className="inline-flex rounded-lg bg-church-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-church-800"
                  >
                    Fungua detail
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : null}

        {!isLoading && filteredDepartments.length > pageSize ? (
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <p>
              Ukurasa {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1 dark:border-slate-700"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1 dark:border-slate-700"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
