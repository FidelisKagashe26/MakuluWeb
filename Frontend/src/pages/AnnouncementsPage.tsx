import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import {
  fetchPublicAnnouncements,
  resolveAnnouncementPdfUrl,
  type AnnouncementItem,
  type AnnouncementType
} from "@/services/adminService";
import { useApiQuery } from "@/hooks/useApiQuery";
import SabbathAnnouncementPreview from "@/components/announcements/SabbathAnnouncementPreview";
import { Menu, X } from "lucide-react";

type TypeCard = {
  key: AnnouncementType;
  title: string;
};

const typeCards: TypeCard[] = [
  {
    key: "emergency",
    title: "Matangazo ya dharura"
  },
  {
    key: "sabbath",
    title: "Matangazo ya Sabato"
  },
  {
    key: "ongoing",
    title: "Matangazo endelevu"
  }
];

function getStatusTone(status: AnnouncementItem["status"]) {
  if (status === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (status === "scheduled") return "bg-church-100 text-church-700 dark:bg-church-900/45 dark:text-church-200";
  if (status === "expired") return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
}

function getAnnouncementCardText(item: AnnouncementItem) {
  if (item.documentData) {
    const firstItem = String(item.documentData.announcementItems.find(Boolean) || "").trim();
    if (firstItem) {
      return firstItem.length > 140 ? `${firstItem.slice(0, 140)}...` : firstItem;
    }

    const announcementDate = String(item.documentData.announcementDate || "").trim();
    if (announcementDate) {
      const parsed = new Date(`${announcementDate}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        const label =
          item.type === "emergency"
            ? "Dharura ya"
            : item.type === "ongoing"
              ? "Tangazo la"
              : "Sabato ya";
        return `${label} ${format(parsed, "dd MMM yyyy")}`;
      }
    }
  }

  const summary = String(item.summary || "").trim();
  if (summary) return summary;
  return "No summary";
}

function getDateTimeLabel(value?: string) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return format(parsed, "dd MMM yyyy, HH:mm");
}

function getNewestActiveAnnouncementId(items: AnnouncementItem[]) {
  return items.find((item) => item.status === "active")?.id || "";
}

function getNewestDateForType(items: AnnouncementItem[]) {
  if (!items.length) return null;
  const newest = items.reduce((prev, current) => {
    const prevDate = new Date(prev.createdAt || 0);
    const currentDate = new Date(current.createdAt || 0);
    return currentDate > prevDate ? current : prev;
  });
  return newest.createdAt ? format(new Date(newest.createdAt), "dd MMM") : null;
}

export default function AnnouncementsPage() {
  const [activeType, setActiveType] = useState<AnnouncementType>("emergency");
  const [selectedId, setSelectedId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobileSidebarTop = "var(--navbar-height, 64px)";
  const mobileSidebarHeight = "calc(100dvh - var(--navbar-height, 64px))";

  const { data, isLoading, error } = useApiQuery(
    () => fetchPublicAnnouncements({ page: 1, limit: 400 }),
    []
  );

  const allAnnouncements = useMemo<AnnouncementItem[]>(() => data?.data ?? [], [data]);

  const countsByType = useMemo(() => {
    const initial: Record<AnnouncementType, number> = {
      emergency: 0,
      sabbath: 0,
      ongoing: 0
    };

    allAnnouncements.forEach((item) => {
      initial[item.type] += 1;
    });

    return initial;
  }, [allAnnouncements]);

  const filteredItems = useMemo(
    () => allAnnouncements.filter((item) => item.type === activeType),
    [allAnnouncements, activeType]
  );
  const newestActiveId = useMemo(() => getNewestActiveAnnouncementId(filteredItems), [filteredItems]);

  useEffect(() => {
    if (!allAnnouncements.length) return;

    if (!allAnnouncements.some((item) => item.type === activeType)) {
      const nextType = typeCards.find((card) => countsByType[card.key] > 0)?.key;
      if (nextType) {
        setActiveType(nextType);
      }
    }
  }, [activeType, allAnnouncements, countsByType]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedId("");
      return;
    }

    if (!selectedId || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selectedAnnouncement = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) || filteredItems[0] || null,
    [filteredItems, selectedId]
  );

  return (
    <>
      <Helmet>
        <title>Matangazo | DODOMA MAKULU SDA CHURCH</title>
        <meta
          name="description"
          content="Matangazo rasmi ya kanisa: dharura, sabato, na endelevu."
        />
      </Helmet>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-3 sm:px-6">
        <div className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-church-600 dark:text-church-300">
              CHURCH ANNOUNCEMENTS
            </p>
            <div className="flex flex-wrap gap-2">
              {typeCards.map((card) => {
                const active = activeType === card.key;
                const cardItems = allAnnouncements.filter((item) => item.type === card.key);
                const hasNew = cardItems.some((item) => item.status === "active");
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => {
                      setActiveType(card.key);
                      setSidebarOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-church-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{card.title}</span>
                      <div className="flex items-center gap-1">
                        {hasNew && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${active ? "bg-rose-400 text-white" : "bg-rose-500 text-white"}`}>
                            NEW
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[0.65rem] ${active ? "bg-white/20 text-white" : "bg-white/75 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                          {countsByType[card.key]}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
        </div>

        {/* Mobile Sidebar Toggle */}
        <div className="mb-4 flex lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {sidebarOpen ? (
              <>
                <X className="h-4 w-4" />
                Funga Orodha
              </>
            ) : (
              <>
                <Menu className="h-4 w-4" />
                Fungua Orodha
              </>
            )}
          </button>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-x-0 bottom-0 z-30 bg-black/50 lg:hidden"
            style={{ top: mobileSidebarTop }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Grid Layout - Responsive */}
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          {/* Sidebar - Mobile Drawer / Desktop Sticky */}
          <aside
            className={`${
              sidebarOpen
                ? "fixed bottom-0 left-0 z-40 w-[19rem] max-w-[90vw] overflow-y-auto"
                : "hidden lg:block"
            } h-full rounded-r-2xl border border-slate-200 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-slate-900 lg:sticky lg:top-28 lg:h-fit lg:w-auto lg:rounded-2xl lg:bg-white/85 lg:dark:bg-slate-900/60`}
            style={sidebarOpen ? { top: mobileSidebarTop, height: mobileSidebarHeight } : undefined}
          >
            <div className="flex items-center justify-between lg:block">
              <h3 className="px-2 text-sm font-semibold uppercase tracking-[0.14em] text-church-600 dark:text-church-300">
                Matangazo yote
              </h3>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2 px-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`announcement-menu-skeleton-${index}`}
                      className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-200/75 dark:border-white/10 dark:bg-white/[0.08]"
                    />
                  ))}
                </div>
              ) : null}
              {!isLoading && filteredItems.length === 0 ? (
                <p className="px-2 text-sm text-slate-500 dark:text-slate-300">Hakuna matangazo kwenye aina hii.</p>
              ) : null}

              {filteredItems.map((item) => {
                const isActiveItem = selectedAnnouncement?.id === item.id;
                const isNewest = item.id === newestActiveId;
                const itemDate = item.createdAt ? format(new Date(item.createdAt), "dd MMM") : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`block w-full rounded-xl border px-3 py-2 text-left transition ${
                      isActiveItem
                        ? "border-church-400 bg-church-50 dark:border-church-500 dark:bg-church-950/45"
                        : "border-slate-200 bg-white/75 hover:border-church-300 hover:bg-church-50/80 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-church-500/35"
                    }`}
                    >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                        {itemDate && (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{itemDate}</p>
                        )}
                      </div>
                      {isNewest ? (
                        <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{getAnnouncementCardText(item)}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="w-full space-y-4 min-w-0">
            {isLoading ? (
              <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-slate-900/60">
                <div className="h-6 w-56 animate-pulse rounded bg-slate-200 dark:bg-white/[0.08]" />
                <div className="h-10 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/[0.08]" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-white/[0.06]" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-white/[0.06]" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200 dark:bg-white/[0.06]" />
                  <div className="h-4 w-9/12 animate-pulse rounded bg-slate-200 dark:bg-white/[0.06]" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-52 animate-pulse rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
                  <div className="h-52 animate-pulse rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
                </div>
              </article>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-300 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-400/45 dark:bg-rose-900/25 dark:text-rose-200">
                Imeshindikana kupakia matangazo.
              </div>
            ) : null}

            {!error && !isLoading && !selectedAnnouncement ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
                Hakuna tangazo la kuonyesha kwa sasa.
              </div>
            ) : null}

            {!isLoading && selectedAnnouncement ? (
              <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft dark:border-white/10 dark:bg-slate-900/60 w-full overflow-hidden">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(selectedAnnouncement.status)}`}>
                        {selectedAnnouncement.status}
                      </span>
                      <span className="rounded-full bg-church-100 px-2.5 py-1 text-xs font-semibold uppercase text-church-700 dark:bg-church-900/45 dark:text-church-200">
                        {typeCards.find((card) => card.key === selectedAnnouncement.type)?.title || "Matangazo"}
                      </span>
                      {selectedAnnouncement.id === newestActiveId ? (
                        <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white break-words">{selectedAnnouncement.title}</h2>
                    {selectedAnnouncement.createdAt ? (
                      <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {format(new Date(selectedAnnouncement.createdAt), "dd MMM yyyy")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <a
                      href={resolveAnnouncementPdfUrl(selectedAnnouncement.id, "a4")}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Download A4 PDF
                    </a>
                    <a
                      href={resolveAnnouncementPdfUrl(selectedAnnouncement.id, "slides")}
                      className="rounded-lg bg-church-700 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-church-800"
                    >
                      Download Slides PDF
                    </a>
                  </div>
                </div>

                {selectedAnnouncement.documentData ? (
                  <div className="mt-4">
                    <SabbathAnnouncementPreview
                      document={selectedAnnouncement.documentData}
                      announcementType={selectedAnnouncement.type}
                    />
                    <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-600 dark:text-slate-300">
                      <p><span className="font-semibold">Start:</span> {getDateTimeLabel(selectedAnnouncement.startDate)}</p>
                      <p><span className="font-semibold">End:</span> {getDateTimeLabel(selectedAnnouncement.endDate)}</p>
                      <p><span className="font-semibold">Updated:</span> {getDateTimeLabel(selectedAnnouncement.updatedAt)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedAnnouncement.summary ? (
                      <p className="mt-4 rounded-xl bg-slate-100/80 px-3 py-2 text-sm text-slate-700 dark:bg-white/[0.05] dark:text-slate-200">
                        {selectedAnnouncement.summary}
                      </p>
                    ) : null}

                    <div className="mt-4 w-full">
                      <article
                        className="prose prose-slate prose-sm sm:prose-base max-w-none w-full dark:prose-invert
                          [&_p]:break-words [&_p]:whitespace-normal
                          [&_h1]:break-words [&_h2]:break-words [&_h3]:break-words
                          [&_ul]:list-inside [&_ol]:list-inside
                          [&_li]:break-words
                          [&_blockquote]:break-words
                          [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block
                          [&_pre]:overflow-x-auto [&_pre]:block
                          [&_code]:break-words [&_code]:whitespace-normal"
                        dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content || "" }}
                      />
                    </div>
                  </>
                )}
              </article>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
