import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";

type MissionCardData = {
  id: string;
  reference: string;
  content: string;
};

type MissionSectionData = {
  sectionTitle: string;
  statementTitle: string;
  statementQuote: string;
  scriptureCards: MissionCardData[];
  imageUrl: string;
  imageAlt: string;
};

const emptyMissionSection: MissionSectionData = {
  sectionTitle: "UTUME WETU",
  statementTitle: "",
  statementQuote: "",
  scriptureCards: [],
  imageUrl: "",
  imageAlt: ""
};

function normalizeMissionSection(input: unknown): MissionSectionData {
  if (!input || typeof input !== "object") {
    return emptyMissionSection;
  }

  const raw = input as any;
  const cardsInput = Array.isArray(raw.scriptureCards) ? raw.scriptureCards : [];

  return {
    sectionTitle: typeof raw.sectionTitle === "string" ? raw.sectionTitle : "",
    statementTitle: typeof raw.statementTitle === "string" ? raw.statementTitle : "",
    statementQuote: typeof raw.statementQuote === "string" ? raw.statementQuote : "",
    scriptureCards: cardsInput.slice(0, 3).map((item: any, index: number): MissionCardData => ({
      id: String(item?.id || `mission-card-${index + 1}`),
      reference: String(item?.reference ?? ""),
      content: String(item?.content ?? "")
    })),
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    imageAlt: typeof raw.imageAlt === "string" ? raw.imageAlt : ""
  };
}

function AccordionToggleIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
        isOpen
          ? "border-church-500/70 bg-church-500/12 text-church-700 dark:border-church-300/70 dark:bg-church-300/15 dark:text-church-100"
          : "border-slate-300/70 bg-white/50 text-slate-600 dark:border-white/25 dark:bg-white/10 dark:text-slate-200"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3.5 8h9" strokeLinecap="round" />
        {!isOpen ? <path d="M8 3.5v9" strokeLinecap="round" /> : null}
      </svg>
    </span>
  );
}

export default function MissionSection() {
  const [mission, setMission] = useState<MissionSectionData>(emptyMissionSection);
  const [isLoading, setIsLoading] = useState(true);
  const visibleCards = useMemo(
    () => mission.scriptureCards.filter((card) => card.reference || card.content),
    [mission.scriptureCards]
  );
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMission = async () => {
      try {
        const response = await api.get<{ ok: boolean; data: Record<string, unknown> }>("/public/site-settings", { params: { t: Date.now() } });
        const mapped = normalizeMissionSection(response.data?.data?.missionSection);
        if (!cancelled) {
          setMission(mapped);
        }
      } catch {
        if (!cancelled) {
          setMission(emptyMissionSection);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMission();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!visibleCards.length) {
      setOpenCardId(null);
      return;
    }

    setOpenCardId((previous) => {
      if (previous && visibleCards.some((card) => card.id === previous)) {
        return previous;
      }
      return visibleCards[0].id;
    });
  }, [visibleCards]);

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-100 py-10 sm:py-12 dark:border-white/10 dark:from-[#0a1438] dark:via-[#0d1a45] dark:to-[#0a1438]">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-church-500/14 blur-3xl dark:bg-church-500/20" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl dark:bg-cyan-400/20" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl uppercase tracking-[0.16em] text-slate-900 sm:text-4xl dark:text-white"
        >
          {mission.sectionTitle || "UTUME WETU"}
        </motion.h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr_.9fr]">
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-slate-900 shadow-soft backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.08] dark:text-white dark:shadow-[0_18px_45px_rgba(6,12,36,0.35)] dark:backdrop-blur-md">
            <h3 className="text-xl leading-relaxed text-church-700 dark:text-church-100">
              {mission.statementTitle || "No data"}
            </h3>
            <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-100/95">
              {mission.statementQuote || (isLoading ? "Loading..." : "No data")}
            </p>
          </article>

          <div className="space-y-3">
            {visibleCards.length === 0 ? (
              <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 shadow-soft backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.08] dark:text-slate-200 dark:shadow-[0_14px_35px_rgba(6,12,36,0.3)] dark:backdrop-blur-md">
                {isLoading ? "Loading..." : "No data"}
              </article>
            ) : (
              visibleCards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-slate-900 shadow-soft backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.08] dark:text-white dark:shadow-[0_14px_35px_rgba(6,12,36,0.3)] dark:backdrop-blur-md"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenCardId((previous) => (previous === card.id ? null : card.id));
                    }}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={openCardId === card.id}
                    aria-controls={`mission-card-content-${card.id}`}
                  >
                    <h4 className="text-base text-church-700 dark:text-church-100">{card.reference}</h4>
                    <AccordionToggleIcon isOpen={openCardId === card.id} />
                  </button>

                  <AnimatePresence initial={false}>
                    {openCardId === card.id ? (
                      <motion.div
                        id={`mission-card-content-${card.id}`}
                        key={`mission-card-content-${card.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-100/90">
                          {card.content}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </article>
              ))
            )}
          </div>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-soft backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.08] dark:shadow-[0_18px_45px_rgba(6,12,36,0.35)] dark:backdrop-blur-md">
            {mission.imageUrl ? (
              <img
                src={mission.imageUrl}
                alt={mission.imageAlt || "Mission image"}
                loading="lazy"
                decoding="async"
                className="h-full min-h-[260px] w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300/60 text-sm text-slate-500 dark:border-white/20 dark:text-slate-300">
                {isLoading ? "Loading..." : "No data"}
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}


