import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

type AnnouncementApi = {
  id: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
};

type ReportApi = {
  id: string;
  departmentId: string;
  title: string;
  content: string;
  reportDate: string;
  author: string;
};

type GroupApi = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  youtubeLink: string;
  type: string;
};

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type RecentMixedItem = {
  id: string;
  kind: "announcement" | "report" | "group";
  badge: string;
  title: string;
  excerpt: string;
  date: string | null;
  imageUrl: string;
  href: string;
};

function truncateText(text: string, max = 120) {
  const clean = String(text || "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}...`;
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "No date";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "No date";
  return format(parsed, "dd MMM yyyy");
}

function sortByDateDesc(items: RecentMixedItem[]) {
  return [...items].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

export default function RecentHighlightsSection() {
  const [items, setItems] = useState<RecentMixedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [announcementsRes, reportsRes, groupsRes] = await Promise.all([
          api.get<ApiResponse<AnnouncementApi[]>>("/public/announcements/active"),
          api.get<ApiResponse<ReportApi[]>>("/public/reports"),
          api.get<ApiResponse<GroupApi[]>>("/public/groups")
        ]);

        const announcementItems: RecentMixedItem[] = (announcementsRes.data?.data || []).map((item) => ({
          id: `ann-${item.id}`,
          kind: "announcement",
          badge: "Matangazo",
          title: item.title,
          excerpt: truncateText(item.content, 135),
          date: item.startDate || null,
          imageUrl: "",
          href: "/matangazo"
        }));

        const reportItems: RecentMixedItem[] = (reportsRes.data?.data || []).map((item) => ({
          id: `rep-${item.id}`,
          kind: "report",
          badge: "Ripoti",
          title: item.title,
          excerpt: truncateText(item.content, 135),
          date: item.reportDate || null,
          imageUrl: "",
          href: "/#reports"
        }));

        const groupItems: RecentMixedItem[] = (groupsRes.data?.data || []).map((item) => ({
          id: `grp-${item.id}`,
          kind: "group",
          badge: item.type && item.type.toLowerCase().includes("kwaya") ? "Kwaya" : "Kikundi",
          title: item.name,
          excerpt: truncateText(item.description, 135),
          date: null,
          imageUrl: item.imageUrl || "",
          href: "/vikundi"
        }));

        const mixed = sortByDateDesc([...announcementItems, ...reportItems, ...groupItems]);

        if (!cancelled) {
          setItems(mixed);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const featured = items.slice(0, 4);
  const summary = items.slice(0, 8);
  const featuredItems: Array<RecentMixedItem | null> = loading ? Array(4).fill(null) : featured;
  const summaryItems: Array<RecentMixedItem | null> = loading ? Array(6).fill(null) : summary;

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-100 py-10 sm:py-12 dark:border-white/10 dark:from-[#0a1438] dark:via-[#0c1a46] dark:to-[#0a1438]">
      <div className="pointer-events-none absolute left-0 top-0 h-44 w-44 rounded-full bg-church-500/12 blur-3xl dark:bg-church-500/15" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/10" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl uppercase tracking-[0.16em] text-slate-900 sm:text-4xl dark:text-white"
        >
          TAARIFA ZA HIVI KARIBUNI
        </motion.h2>

        {!loading && items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300/75 bg-white/70 p-5 text-center text-sm text-slate-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-slate-200">
            No data
          </div>
        ) : null}

        {loading || items.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {featuredItems.map((item, index) => {
              if (!item) {
                return (
                  <div
                    key={`placeholder-${index}`}
                    className="h-[250px] animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-white/15 dark:bg-white/[0.08]"
                  />
                );
              }

              return (
                <article
                  key={item.id}
                  className="group relative h-[250px] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      No image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />

                  <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-white">
                    <span className="rounded-md border border-white/50 bg-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                      {item.badge}
                    </span>
                    <h3 className="mt-2 text-lg leading-tight">{item.title}</h3>
                    <p className="mt-1 text-sm text-white/90">{item.excerpt}</p>
                    <a href={item.href} className="mt-2 inline-block text-sm text-church-200 hover:text-white">
                      Soma zaidi
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-soft backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.08] dark:shadow-[0_18px_45px_rgba(6,12,36,0.35)] dark:backdrop-blur-md">
            <h3 className="px-1 text-sm uppercase tracking-[0.14em] text-slate-800 dark:text-white/95">Muhtasari wa Recents</h3>

            <div className="mt-2 divide-y divide-slate-200 dark:divide-white/15">
              {summaryItems.map((item, index) => {
                if (!item) {
                  return (
                    <div key={`summary-placeholder-${index}`} className="flex items-center gap-3 py-3">
                      <div className="h-12 w-14 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                      </div>
                    </div>
                  );
                }

                return (
                  <a key={item.id} href={item.href} className="flex items-center gap-3 py-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-14 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-14 items-center justify-center rounded-md bg-slate-200 text-[0.7rem] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        No image
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-200/85">
                        {item.badge} | {formatDate(item.date)}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}
