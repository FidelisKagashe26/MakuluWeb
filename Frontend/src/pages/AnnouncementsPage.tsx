import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import {
  fetchPublicAnnouncements,
  resolveAnnouncementPdfUrl,
  type AnnouncementItem
} from "@/services/adminService";
import { useApiQuery } from "@/hooks/useApiQuery";
import SabbathAnnouncementPreview from "@/components/announcements/SabbathAnnouncementPreview";
import { Menu, X } from "lucide-react";

type AnnouncementStatus = "scheduled" | "active" | "expired";

type StatusCard = {
  key: AnnouncementStatus;
  title: string;
  description: string;
  emptyState: string;
};

const statusCards: StatusCard[] = [
  {
    key: "active",
    title: "Yanayoendelea",
    description: "Matangazo yanayoonekana live kwa sasa.",
    emptyState: "Hakuna tangazo linaloendelea kwa sasa."
  },
  {
    key: "scheduled",
    title: "Yajayo",
    description: "Matangazo yaliyoratibiwa kuja mbele.",
    emptyState: "Hakuna tangazo la yajayo kwa sasa."
  },
  {
    key: "expired",
    title: "Yaliyopita",
    description: "Kumbukumbu ya matangazo yaliyomalizika.",
    emptyState: "Hakuna tangazo lililopita kwa sasa."
  }
];

function getStatusTone(status: AnnouncementItem["status"]) {
  if (status === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (status === "scheduled") return "bg-church-100 text-church-700 dark:bg-church-900/45 dark:text-church-200";
  if (status === "expired") return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
}

function getStatusLabel(status: AnnouncementItem["status"]) {
  if (status === "scheduled") return "Yajayo";
  if (status === "active") return "Yanayoendelea";
  if (status === "expired") return "Yaliyopita";
  return "Draft";
}

function getTypeLabel(type: AnnouncementItem["type"]) {
  if (type === "emergency") return "Dharura";
  if (type === "sabbath") return "Sabato";
  return "Kawaida";
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
        return `Tarehe: ${format(parsed, "dd MMM yyyy")}`;
      }
    }
  }

  const summary = String(item.summary || "").trim();
  if (summary) return summary;
  return "Hakuna muhtasari";
}

function getDateTimeLabel(value?: string) {
  if (!value) return "Haijawekwa";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Haijawekwa";
  return format(parsed, "dd MMM yyyy, HH:mm");
}

function getNewestActiveAnnouncementId(items: AnnouncementItem[]) {
  return items.find((item) => item.status === "active")?.id || "";
}

function toTs(value?: string) {
  const ts = new Date(String(value || "")).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export default function AnnouncementsPage() {
  const [activeStatus, setActiveStatus] = useState<AnnouncementStatus>("active");
  const [selectedId, setSelectedId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobileSidebarTop = "var(--navbar-height, 64px)";
  const mobileSidebarHeight = "calc(100dvh - var(--navbar-height, 64px))";

  const { data, isLoading, error } = useApiQuery(
    () => fetchPublicAnnouncements({ page: 1, limit: 400 }),
    []
  );

  const allEvents = useMemo<AnnouncementItem[]>(() => data?.data ?? [], [data]);

  const countsByStatus = useMemo(() => {
    const initial: Record<AnnouncementStatus, number> = {
      scheduled: 0,
      active: 0,
      expired: 0
    };

    allEvents.forEach((item) => {
      if (item.status === "scheduled" || item.status === "active" || item.status === "expired") {
        initial[item.status] += 1;
      }
    });

    return initial;
  }, [allEvents]);

  const filteredItems = useMemo(() => {
    const items = allEvents.filter((item) => item.status === activeStatus);

    return [...items].sort((left, right) => {
      if (activeStatus === "scheduled") {
        return toTs(left.startDate) - toTs(right.startDate);
      }

      if (activeStatus === "expired") {
        return toTs(right.endDate) - toTs(left.endDate);
      }

      return toTs(left.startDate) - toTs(right.startDate);
    });
  }, [allEvents, activeStatus]);

  const newestActiveId = useMemo(() => getNewestActiveAnnouncementId(allEvents), [allEvents]);
  const activeStatusMeta = useMemo(
    () => statusCards.find((card) => card.key === activeStatus) || statusCards[0],
    [activeStatus]
  );

  useEffect(() => {
    if (!allEvents.length) return;

    if (!allEvents.some((item) => item.status === activeStatus)) {
      const nextStatus = statusCards.find((card) => countsByStatus[card.key] > 0)?.key;
      if (nextStatus) {
        setActiveStatus(nextStatus);
      }
    }
  }, [activeStatus, allEvents, countsByStatus]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedId("");
      return;
    }

    if (!selectedId || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selectedEvent = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) || filteredItems[0] || null,
    [filteredItems, selectedId]
  );

  return (
    <>
      <Helmet>
        <title>Matangazo | DODOMA MAKULU SDA CHURCH</title>
        <meta
          name="description"
          content="Matangazo ya kanisa: yajayo, yanayoendelea, na yaliyopita."
        />
      </Helmet>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-3 sm:px-6">
        <div className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-church-600 dark:text-church-300">
                CHURCH ANNOUNCEMENTS
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Matangazo ya Kanisa</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {activeStatusMeta.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusCards.map((card) => {
                const active = activeStatus === card.key;
                const hasLive = card.key === "active" && countsByStatus.active > 0;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => {
                      setActiveStatus(card.key);
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
                        {hasLive ? (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                              active ? "bg-rose-400 text-white" : "bg-rose-500 text-white"
                            }`}
                          >
                            LIVE
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-white/75 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {countsByStatus[card.key]}
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

        {sidebarOpen ? (
          <div
            className="fixed inset-x-0 bottom-0 z-30 bg-black/50 lg:hidden"
            style={{ top: mobileSidebarTop }}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
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
                Matangazo
              </h3>
              <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2 px-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`event-menu-skeleton-${index}`}
                      className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-200/75 dark:border-white/10 dark:bg-white/[0.08]"
                    />
                  ))}
                </div>
              ) : null}

              {!isLoading && filteredItems.length === 0 ? (
                <p className="px-2 text-sm text-slate-500 dark:text-slate-300">
                  {activeStatusMeta.emptyState}
                </p>
              ) : null}

              {filteredItems.map((item) => {
                const isActiveItem = selectedEvent?.id === item.id;
                const isNewest = item.id === newestActiveId;
                const itemDate = item.startDate ? format(new Date(item.startDate), "dd MMM") : null;
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
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        {itemDate ? (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{itemDate}</p>
                        ) : null}
                      </div>
                      {isNewest ? (
                        <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {getAnnouncementCardText(item)}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
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
              </article>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-300 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-400/45 dark:bg-rose-900/25 dark:text-rose-200">
                Imeshindikana kupakia matangazo.
              </div>
            ) : null}

            {!error && !isLoading && !selectedEvent ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
                {activeStatusMeta.emptyState}
              </div>
            ) : null}

            {!isLoading && selectedEvent ? (
              <article className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/60 sm:p-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(selectedEvent.status)}`}>
                        {getStatusLabel(selectedEvent.status)}
                      </span>
                      <span className="rounded-full bg-church-100 px-2.5 py-1 text-xs font-semibold uppercase text-church-700 dark:bg-church-900/45 dark:text-church-200">
                        {getTypeLabel(selectedEvent.type)}
                      </span>
                      {selectedEvent.id === newestActiveId ? (
                        <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 break-words text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">
                      {selectedEvent.title}
                    </h2>
                    {selectedEvent.createdAt ? (
                      <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {format(new Date(selectedEvent.createdAt), "dd MMM yyyy")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <a
                      href={resolveAnnouncementPdfUrl(selectedEvent.id, "a4")}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Download A4 PDF
                    </a>
                    <a
                      href={resolveAnnouncementPdfUrl(selectedEvent.id, "slides")}
                      className="rounded-lg bg-church-700 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-church-800"
                    >
                      Download Slides PDF
                    </a>
                  </div>
                </div>

                {selectedEvent.documentData ? (
                  <div className="mt-4">
                    <SabbathAnnouncementPreview
                      document={selectedEvent.documentData}
                      announcementType={selectedEvent.type}
                    />
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-3">
                      <p>
                        <span className="font-semibold">Start:</span>{" "}
                        {getDateTimeLabel(selectedEvent.startDate)}
                      </p>
                      <p>
                        <span className="font-semibold">End:</span>{" "}
                        {getDateTimeLabel(selectedEvent.endDate)}
                      </p>
                      <p>
                        <span className="font-semibold">Updated:</span>{" "}
                        {getDateTimeLabel(selectedEvent.updatedAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedEvent.summary ? (
                      <p className="mt-4 rounded-xl bg-slate-100/80 px-3 py-2 text-sm text-slate-700 dark:bg-white/[0.05] dark:text-slate-200">
                        {selectedEvent.summary}
                      </p>
                    ) : null}

                    <div className="mt-4 w-full">
                      <article
                        className="prose prose-slate prose-sm max-w-none w-full break-words dark:prose-invert sm:prose-base"
                        dangerouslySetInnerHTML={{ __html: selectedEvent.content || "" }}
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

