import { format } from "date-fns";
import { motion } from "framer-motion";
import { sermons } from "@/data/content";

export default function SermonsSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Mahubiri</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">YouTube Sermons</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sermons.map((sermon) => (
          <article
            key={sermon.id}
            className="overflow-hidden rounded-2xl border border-church-200/60 bg-white/88 transition hover:-translate-y-1 hover:shadow-soft dark:border-church-700/40 dark:bg-church-950/62"
          >
            <a
              href={`https://www.youtube.com/watch?v=${sermon.youtubeId}`}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={`https://i.ytimg.com/vi/${sermon.youtubeId}/hqdefault.jpg`}
                alt={sermon.title}
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover"
              />
            </a>
            <div className="p-4">
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">{sermon.title}</h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sermon.preacher}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                {format(new Date(sermon.date), "dd MMM yyyy")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
