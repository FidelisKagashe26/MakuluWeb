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
    <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-100 py-10 sm:py-12 dark:border-white/10 dark:from-[#0a1438] dark:via-[#0c1a46] dark:to-[#0a1438]">
      <div className="pointer-events-none absolute left-0 top-0 h-44 w-44 rounded-full bg-church-500/10 blur-3xl dark:bg-church-500/15" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/10" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
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

        {isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`home-events-skeleton-${index}`}
                className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white/70 dark:border-white/15 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && displayEvents.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300/75 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-slate-200">
            Hakuna matukio ya kuonyesha kwa sasa.
          </div>
        ) : null}

        {!isLoading && displayEvents.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayEvents.map((event) => (
              <article
                key={event.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/90 transition hover:-translate-y-1 hover:border-church-300 hover:shadow-soft dark:border-white/15 dark:bg-white/[0.05] dark:hover:border-church-500/35"
              >
                <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-300">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(event.resolvedStatus)}`}>
                      {statusLabel(event.resolvedStatus)}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-300">
                      {getDateLabel(event.startDate)}
                    </span>
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                    {event.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                    {event.summary || "Hakuna muhtasari"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-300/90">
                    {event.location || "Mahali haijawekwa"}
                  </p>
                  <a
                    href="/matukio"
                    className="mt-3 inline-flex rounded-lg bg-church-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-church-800"
                  >
                    Soma tukio
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

