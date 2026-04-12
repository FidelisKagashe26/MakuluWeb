import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { resolvePublicUploadUrl } from "@/services/adminService";

type EventApi = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "draft" | "upcoming" | "ongoing" | "past";
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
  kind: "event" | "report" | "group";
  badge: string;
  title: string;
  excerpt: string;
  date: string | null;
  imageUrl: string;
  href: string;
  note: string;
};

function truncateText(text: string, max = 120) {
  const clean = String(text || "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}...`;
}

function toTs(value?: string) {
  const ts = new Date(String(value || "")).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function resolveEventStatus(item: EventApi, nowTs: number) {
  const startTs = toTs(item.startDate);
  const endTs = toTs(item.endDate);

  if (startTs && endTs) {
    if (nowTs < startTs) return "upcoming";
    if (nowTs > endTs) return "past";
    return "ongoing";
  }

  if (startTs && !endTs) {
    return nowTs < startTs ? "upcoming" : "ongoing";
  }

  if (!startTs && endTs) {
    return nowTs > endTs ? "past" : "ongoing";
  }

  if (item.status === "upcoming" || item.status === "ongoing" || item.status === "past") {
    return item.status;
  }

  return "ongoing";
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "Tarehe haijawekwa";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "Tarehe haijawekwa";
  return format(parsed, "dd/MM/yyyy HH:mm");
}

function sortByDateDesc(items: RecentMixedItem[]) {
  return [...items].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

function getBadgeTone(kind: RecentMixedItem["kind"]) {
  if (kind === "event") return "bg-church-100 text-church-700 dark:bg-church-900/45 dark:text-church-200";
  if (kind === "report") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/45 dark:text-indigo-200";
}

export default function RecentHighlightsSection() {
  const [items, setItems] = useState<RecentMixedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [eventsRes, reportsRes, groupsRes] = await Promise.all([
          api.get<ApiResponse<EventApi[]>>("/public/events", { params: { page: 1, limit: 50 } }),
          api.get<ApiResponse<ReportApi[]>>("/public/reports"),
          api.get<ApiResponse<GroupApi[]>>("/public/groups")
        ]);

        const nowTs = Date.now();
        const eventItems: RecentMixedItem[] = (eventsRes.data?.data || [])
          .map((item) => {
            const resolvedStatus = resolveEventStatus(item, nowTs);
            const badge =
              resolvedStatus === "ongoing"
                ? "Tukio Linaloendelea"
                : resolvedStatus === "upcoming"
                  ? "Tukio Lijalo"
                  : "Tukio Lililopita";

            return {
              id: `evt-${item.id}`,
              kind: "event" as const,
              badge,
              title: item.title,
              excerpt: truncateText(item.summary || item.content, 120),
              date: item.startDate || null,
              imageUrl: resolvePublicUploadUrl(item.imageUrl || ""),
              href: "/matukio",
              note: item.location || "Mahali haijawekwa"
            };
          })
          .filter((item) => item.badge !== "Tukio Lililopita");

        const reportItems: RecentMixedItem[] = (reportsRes.data?.data || []).map((item) => ({
          id: `rep-${item.id}`,
          kind: "report",
          badge: "Ripoti",
          title: item.title,
          excerpt: truncateText(item.content, 120),
          date: item.reportDate || null,
          imageUrl: "",
          href: "/#reports",
          note: item.author ? `Mwandishi: ${item.author}` : "Ripoti ya idara"
        }));

        const groupItems: RecentMixedItem[] = (groupsRes.data?.data || []).map((item) => ({
          id: `grp-${item.id}`,
          kind: "group",
          badge: item.type && item.type.toLowerCase().includes("kwaya") ? "Kwaya" : "Kikundi",
          title: item.name,
          excerpt: truncateText(item.description, 120),
          date: null,
          imageUrl: resolvePublicUploadUrl(item.imageUrl || ""),
          href: "/vikundi",
          note: item.type || "Kikundi cha kanisa"
        }));

        const mixed = sortByDateDesc([...eventItems, ...reportItems, ...groupItems]).slice(0, 10);

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

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-100 py-10 sm:py-12 dark:border-white/10 dark:from-[#0a1438] dark:via-[#0c1a46] dark:to-[#0a1438]">
      <div className="pointer-events-none absolute left-0 top-0 h-44 w-44 rounded-full bg-church-500/10 blur-3xl dark:bg-church-500/15" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/10" />

      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold uppercase tracking-[0.14em] text-slate-900 sm:text-2xl dark:text-white"
          >
            TAARIFA ZA HIVI KARIBUNI
          </motion.h2>
          <a
            href="/matukio"
            className="shrink-0 text-sm font-semibold text-church-700 hover:text-church-800 dark:text-church-300"
          >
            Tazama zote
          </a>
        </div>

        {loading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`recent-skeleton-${index}`}
                className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white/70 dark:border-white/15 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300/75 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-slate-200">
            Hakuna taarifa kwa sasa.
          </div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white/85 p-2 transition hover:border-church-300 hover:bg-white dark:border-white/15 dark:bg-white/[0.05] dark:hover:border-church-500/35"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-20 w-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-24 items-center justify-center rounded-lg bg-slate-200 text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    No image
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getBadgeTone(item.kind)}`}>
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-300">{formatDate(item.date)}</span>
                  </div>

                  <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-church-700 dark:text-white dark:group-hover:text-church-300">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{item.excerpt}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-300/90">{item.note}</p>
                </div>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

