import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { departments } from "@/data/content";

export default function DepartmentsSection() {
  const previewDepartments = departments.slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Idara</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Idara Overview</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {previewDepartments.map((department) => (
          <article
            key={department.id}
            className="overflow-hidden rounded-2xl border border-church-200/60 bg-white/88 transition hover:-translate-y-1 hover:shadow-soft dark:border-church-700/40 dark:bg-church-950/62"
          >
            <img
              src={department.image}
              alt={department.name}
              loading="lazy"
              decoding="async"
              className="h-40 w-full object-cover"
            />
            <div className="p-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                {department.name}
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {department.description}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-church-700 dark:text-church-200">
                Kamati: {department.committee.length} | Reports: {department.reports.length}
              </p>
              <Link
                to={`/idara/${department.id}`}
                className="mt-3 inline-flex rounded-lg bg-church-700 px-3 py-2 text-xs font-bold text-white hover:bg-church-800"
              >
                Tazama Idara
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5">
        <Link
          to="/idara"
          className="inline-flex rounded-xl border border-church-300 px-4 py-2 text-sm font-semibold text-church-700 transition hover:bg-church-50 dark:border-church-800 dark:text-church-300 dark:hover:bg-slate-800"
        >
          Orodha ya idara zote
        </Link>
      </div>
    </motion.section>
  );
}
