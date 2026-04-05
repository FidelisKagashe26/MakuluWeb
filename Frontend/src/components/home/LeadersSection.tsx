import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { leaders } from "@/data/content";

export default function LeadersSection() {
  const previewLeaders = leaders.slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Uongozi</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Viongozi Wakuu</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {previewLeaders.map((leader) => (
          <article
            key={leader.id}
            className="group rounded-2xl border border-church-200/60 bg-white/88 p-4 transition hover:-translate-y-1 hover:shadow-soft dark:border-church-700/40 dark:bg-church-950/62"
          >
            <img
              src={leader.image}
              alt={leader.name}
              loading="lazy"
              decoding="async"
              className="h-52 w-full rounded-xl object-cover transition duration-300 group-hover:brightness-110"
            />
            <h4 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{leader.name}</h4>
            <p className="text-sm font-semibold text-church-700 dark:text-church-300">{leader.role}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{leader.bio}</p>
          </article>
        ))}
      </div>
      <div className="mt-5">
        <Link
          to="/viongozi"
          className="inline-flex rounded-xl border border-church-300 px-4 py-2 text-sm font-semibold text-church-700 transition hover:bg-church-50 dark:border-church-800 dark:text-church-300 dark:hover:bg-slate-800"
        >
          Tazama viongozi wote
        </Link>
      </div>
    </motion.section>
  );
}
