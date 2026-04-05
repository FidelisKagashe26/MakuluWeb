import { format } from "date-fns";
import { motion } from "framer-motion";
import { announcements } from "@/data/content";
import { getVisibleAnnouncements, isAnnouncementActive } from "@/lib/announcements";

export default function EventsSection() {
  const visibleEvents = getVisibleAnnouncements(announcements).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <motion.section
      id="matangazo"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">
            Matangazo
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Upcoming Events / Auto Live</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Yanayoonekana sasa yanazingatia sheria ya startDate/endDate.
        </p>
      </div>

      {visibleEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-church-300/55 bg-white/75 p-5 text-sm text-slate-700 dark:border-church-700/45 dark:bg-church-950/55 dark:text-slate-300">
          Hakuna tangazo active kwa sasa.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-church-200/60 bg-white/88 p-4 transition hover:-translate-y-1 hover:shadow-soft dark:border-church-700/40 dark:bg-church-950/62"
            >
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                  isAnnouncementActive(new Date(), event.startDate, event.endDate)
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Live
              </span>
              <h4 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{event.title}</h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.content}</p>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                {format(new Date(event.startDate), "dd MMM yyyy, HH:mm")} -{" "}
                {format(new Date(event.endDate), "dd MMM yyyy, HH:mm")}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{event.location}</p>
            </article>
          ))}
        </div>
      )}
    </motion.section>
  );
}
