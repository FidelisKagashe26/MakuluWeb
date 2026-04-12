import { format } from "date-fns";
import { motion } from "framer-motion";
import { useApiQuery } from "@/hooks/useApiQuery";
import { fetchPublicEvents, type EventItem } from "@/services/adminService";

type VisibleEventStatus = "past" | "ongoing" | "upcoming";
type EventWithResolvedStatus = EventItem & { resolvedStatus: VisibleEventStatus };

function toTs(value?: string) {
  const ts = new Date(String(value || "")).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function resolveEventStatus(item: EventItem, nowTs: number) {
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

function statusLabel(status: VisibleEventStatus) {
  if (status === "ongoing") return "Yanayoendelea";
  if (status === "upcoming") return "Yajayo";
  return "Yaliyopita";
}

function statusTone(status: VisibleEventStatus) {
  if (status === "ongoing") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (status === "upcoming") return "bg-church-100 text-church-700 dark:bg-church-900/45 dark:text-church-200";
  return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function getDateLabel(value?: string) {
  const ts = toTs(value);
  if (!ts) return "Tarehe haijawekwa";
  return format(new Date(ts), "dd/MM/yyyy HH:mm");
}

function sortByFreshness(items: EventWithResolvedStatus[]) {
  const rank: Record<VisibleEventStatus, number> = {
    ongoing: 0,
    upcoming: 1,
    past: 2
  };

  return [...items].sort((left, right) => {
    const rankDiff = rank[left.resolvedStatus] - rank[right.resolvedStatus];
    if (rankDiff !== 0) return rankDiff;

    if (left.resolvedStatus === "upcoming") {
      return toTs(left.startDate) - toTs(right.startDate);
    }
    if (left.resolvedStatus === "past") {
      return toTs(right.endDate) - toTs(left.endDate);
    }
    return toTs(left.startDate) - toTs(right.startDate);
  });
}

export default function RecentHighlightsSection() {
  const { data, isLoading } = useApiQuery(
    () => fetchPublicEvents({ page: 1, limit: 80 }),
    []
  );

  const allEvents = (data?.data ?? []) as EventItem[];
  const displayEvents = sortByFreshness(
    allEvents.map((item) => ({
      ...item,
      resolvedStatus: resolveEventStatus(item, Date.now())
    }))
  ).slice(0, 5);

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-slate-100 py-8 sm:py-10 dark:border-white/10 dark:bg-[#0b1538]">
      <div className="pointer-events-none absolute left-0 top-0 h-44 w-44 rounded-full bg-church-500/10 blur-3xl dark:bg-church-500/15" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/10" />

      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-bold uppercase tracking-[0.12em] text-slate-900 sm:text-xl dark:text-white"
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
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
          Matukio
        </p>

        {isLoading ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 dark:border-white/15 dark:bg-white/[0.05]">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`home-events-skeleton-${index}`}
                className={`flex items-start gap-3 p-3 ${index !== 4 ? "border-b border-slate-200 dark:border-white/10" : ""}`}
              >
                <div className="h-20 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-white/[0.12]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-white/[0.12]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/[0.12]" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-white/[0.12]" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && displayEvents.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300/75 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-slate-200">
            Hakuna matukio ya kuonyesha kwa sasa.
          </div>
        ) : null}

        {!isLoading && displayEvents.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-soft dark:border-white/15 dark:bg-white/[0.05]">
            {displayEvents.map((event, index) => (
              <a
                key={event.id}
                href="/matukio"
                className={`group flex items-start gap-3 p-3 transition hover:bg-slate-50 dark:hover:bg-white/[0.04] ${
                  index !== displayEvents.length - 1 ? "border-b border-slate-200 dark:border-white/10" : ""
                }`}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-slate-500 dark:text-slate-300">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-xl font-semibold text-slate-900 dark:text-white">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    {getDateLabel(event.startDate)} | {event.location || "Mahali haijawekwa"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {event.summary || "Hakuna muhtasari"}
                  </p>
                </div>

                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${statusTone(event.resolvedStatus)}`}>
                  {statusLabel(event.resolvedStatus)}
                </span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

