import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { churchInfo } from "@/data/content";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-church-200 bg-hero-mesh bg-church-50 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-8"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-church-700 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
            {churchInfo.subtitle}
          </p>
          <h2 className="text-3xl font-extrabold leading-tight text-church-900 dark:text-church-50 sm:text-4xl">
            {churchInfo.name}
          </h2>
          <p className="mt-4 max-w-3xl text-base text-slate-700 dark:text-slate-200">
            {churchInfo.scripture}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            {churchInfo.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/matukio"
              className="rounded-xl bg-church-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-church-800"
            >
              {t("hero.ctaPrimary")}
            </a>
            <a
              href="#mawasiliano"
              className="rounded-xl border border-church-300 px-5 py-3 text-sm font-bold text-church-900 transition hover:bg-church-100 dark:border-slate-700 dark:text-church-100 dark:hover:bg-slate-800"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>
        </div>

        <img
          src="https://images.unsplash.com/photo-1468421870903-4df1664ac249?auto=format&fit=crop&w=1200&q=80"
          alt="Kanisa la Waadventista"
          loading="lazy"
          decoding="async"
          className="h-64 w-full rounded-2xl object-cover shadow-soft lg:h-[22rem]"
        />
      </div>
    </motion.section>
  );
}
