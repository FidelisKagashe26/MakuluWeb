import { format } from "date-fns";
import { motion } from "framer-motion";
import { reports } from "@/data/content";

export default function ReportsSection() {
  return (
    <motion.section
      id="reports"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Ripoti</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Latest Reports</h3>
      <div className="mt-5 grid gap-3">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-xl border border-church-200/60 bg-white/88 p-4 dark:border-church-700/40 dark:bg-church-950/62"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">{report.title}</h4>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                {format(new Date(report.date), "dd MMM yyyy")}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-church-700 dark:text-church-300">
              {report.department} | {report.author}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.excerpt}</p>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
