import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { groups } from "@/data/content";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

export default function ChoirsGroupsSection() {
  const previewGroups = groups.slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-church-300/45 bg-church-50/85 p-6 shadow-soft backdrop-blur-xl dark:border-church-600/35 dark:bg-church-950/40"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Huduma</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Kwaya & Vikundi</h3>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {previewGroups.map((group) => (
          <article
            key={group.id}
            className="overflow-hidden rounded-2xl border border-church-200/60 bg-white/88 transition hover:-translate-y-1 hover:shadow-soft dark:border-church-700/40 dark:bg-church-950/62"
          >
            <img
              src={group.image}
              alt={group.name}
              loading="lazy"
              decoding="async"
              className="h-40 w-full object-cover"
            />
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{group.name}</h4>
                <span className="rounded-full bg-church-100 px-2 py-1 text-[11px] font-bold uppercase text-church-700 dark:bg-church-900/40 dark:text-church-300">
                  {group.type}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{group.description}</p>
              <a
                href={group.youtubeChannelLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-lg bg-church-700 px-3 py-2 text-xs font-bold text-white hover:bg-church-800"
              >
                YouTube Channel
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-church-200/65 dark:border-church-700/40">
        <iframe
          className="aspect-video w-full"
          src={toYouTubeEmbedUrl(groups[0].youtubeVideoLink) ?? undefined}
          title="Kwaya na Vikundi"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <div className="mt-5">
        <Link
          to="/vikundi"
          className="inline-flex rounded-xl border border-church-300 px-4 py-2 text-sm font-semibold text-church-700 transition hover:bg-church-50 dark:border-church-800 dark:text-church-300 dark:hover:bg-slate-800"
        >
          Tazama vikundi vyote
        </Link>
      </div>
    </motion.section>
  );
}
