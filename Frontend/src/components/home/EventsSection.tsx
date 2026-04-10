import { format } from "date-fns";
import { motion } from "framer-motion";
import { useApiQuery } from "@/hooks/useApiQuery";
import { fetchPublicEvents, type EventItem } from "@/services/adminService";

export default function EventsSection() {
  const { data, isLoading } = useApiQuery(
    () => fetchPublicEvents({ status: "ongoing", page: 1, limit: 6 }),
    []
  );

  const ongoingEvents: EventItem[] = data?.data ?? [];

  return (
    <motion.section
      id="matukio"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Matukio</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Yanayoendelea Sasa</h3>
        </div>
        <a href="/matukio" className="text-sm font-semibold text-church-700 hover:text-church-800 dark:text-church-300">
          Tazama matukio yote
        </a>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`events-skeleton-${index}`}
              className="h-48 animate-pulse rounded-2xl border border-church-200/60 bg-white/70 dark:border-church-700/40 dark:bg-church-950/62"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && ongoingEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-church-300/55 bg-white/75 p-5 text-sm text-slate-700 dark:border-church-700/45 dark:bg-church-950/55 dark:text-slate-300">
          Hakuna tukio linaloendelea kwa sasa.
        </div>
      ) : null}

      {!isLoading && ongoingEvents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ongoingEvents.map((event) => (
            <article
              key={event.id}
              className="overflow-hidden rounded-2xl border border-church-200/60 bg-white/88 transition hover:-translate-y-1 hover:shadow-soft dark:border-church-700/40 dark:bg-church-950/62"
            >
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <div className="p-4">
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Inaendelea
                </span>
                <h4 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{event.title}</h4>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{event.summary || event.content}</p>
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {format(new Date(event.startDate), "dd MMM yyyy, HH:mm")} - {format(new Date(event.endDate), "dd MMM yyyy, HH:mm")}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{event.location || "Location not set"}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}

