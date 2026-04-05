import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import { useApiQuery } from "@/hooks/useApiQuery";
import { fetchPublicGroups } from "@/services/adminService";

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useApiQuery(
    () => fetchPublicGroups({ page: 1, limit: 200 }),
    []
  );

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = data?.data ?? [];
    if (!query) return items;

    return items.filter((group) => {
      return (
        String(group.name || "").toLowerCase().includes(query) ||
        String(group.description || "").toLowerCase().includes(query) ||
        String(group.type || "").toLowerCase().includes(query)
      );
    });
  }, [data?.data, search]);

  return (
    <>
      <Helmet>
        <title>Kwaya & Vikundi | DODOMA MAKULU SDA CHURCH</title>
        <meta
          name="description"
          content="Kwaya na vikundi vya kanisa pamoja na YouTube channel link na embedded video preview."
        />
      </Helmet>

      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Vikundi</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Kwaya & Vikundi</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Orodha ya vikundi vilivyopakiwa kutoka backend.
          </p>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tafuta kikundi..."
            className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-church-500 focus:ring-2 focus:ring-church-100 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`group-loading-${index}`}
                className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/75 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-300">
            No data
          </div>
        ) : null}

        {!isLoading && filteredGroups.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredGroups.map((group) => {
              const embedUrl = group.youtubeEmbedUrl || toYouTubeEmbedUrl(group.youtubeLink);
              return (
                <article
                  key={group.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-950"
                >
                  {group.imageUrl ? (
                    <img
                      src={group.imageUrl}
                      alt={group.name}
                      loading="lazy"
                      decoding="async"
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-200 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      No image
                    </div>
                  )}
                  <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{group.name}</h3>
                      <span className="rounded-full bg-church-100 px-2 py-1 text-[11px] font-semibold text-church-700 dark:bg-church-900/40 dark:text-church-300">
                        {group.type || "No data"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{group.description || "No data"}</p>
                    {group.youtubeLink ? (
                      <a
                        href={group.youtubeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg bg-church-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-church-800"
                      >
                        Fungua YouTube
                      </a>
                    ) : null}
                    {embedUrl ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <iframe
                          className="aspect-video w-full"
                          src={embedUrl}
                          title={`${group.name} video preview`}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        No data
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </>
  );
}
