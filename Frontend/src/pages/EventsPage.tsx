import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Menu, X } from "lucide-react";
import { fetchPublicEvents, type EventItem } from "@/services/adminService";
import { useApiQuery } from "@/hooks/useApiQuery";

type VisibleEventStatus = "past" | "ongoing" | "upcoming";

type StatusCard = {
  key: VisibleEventStatus;
  title: string;
  emptyState: string;
};

type EventWithResolvedStatus = EventItem & {
  resolvedStatus: VisibleEventStatus;
};

const statusCards: StatusCard[] = [
  {
    key: "past",
    title: "Yaliyopita",
    emptyState: "Hakuna tukio lililopita kwa sasa."
  },
  {
    key: "ongoing",
    title: "Yanayoendelea",
    emptyState: "Hakuna tukio linaloendelea kwa sasa."
  },
  {
    key: "upcoming",
    title: "Yajayo",
    emptyState: "Hakuna tukio la yajayo kwa sasa."
  }
];

function getStatusTone(status: VisibleEventStatus) {
  if (status === "ongoing") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (status === "upcoming") return "bg-church-100 text-church-700 dark:bg-church-900/45 dark:text-church-200";
  return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function getStatusLabel(status: VisibleEventStatus) {
  if (status === "ongoing") return "Yanayoendelea";
  if (status === "upcoming") return "Yajayo";
  return "Yaliyopita";
}

function getDateTimeLabel(value?: string) {
  if (!value) return "Haijawekwa";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Haijawekwa";
  return format(parsed, "dd MMM yyyy, HH:mm");
}

function toTs(value?: string) {
  const ts = new Date(String(value || "")).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function resolveEventStatus(item: EventItem, nowTs: number) {
  const startTs = toTs(item.startDate);
  const endTs = toTs(item.endDate);

  if (startTs && endTs) {
    if (nowTs < startTs) return "upcoming";
    if (nowTs > endTs) return "past";
    return "ongoing";
  }

  if (startTs && !endTs) {
    return nowTs < startTs ? "upcoming" : "ongoing";
  }

  if (!startTs && endTs) {
    return nowTs > endTs ? "past" : "ongoing";
  }

  if (item.status === "upcoming" || item.status === "ongoing" || item.status === "past") {
    return item.status;
  }

  return "ongoing";
}

function sortEventsByStatus(items: EventWithResolvedStatus[], status: VisibleEventStatus) {
  return [...items].sort((left, right) => {
    if (status === "upcoming") {
      return toTs(left.startDate) - toTs(right.startDate);
    }

    if (status === "past") {
      return toTs(right.endDate) - toTs(left.endDate);
    }

    return toTs(left.startDate) - toTs(right.startDate);
  });
}

function getListDateLabel(item: EventItem) {
  const startTs = toTs(item.startDate);
  const endTs = toTs(item.endDate);

  if (startTs && endTs) {
    return `${format(new Date(startTs), "dd/MM/yyyy HH:mm")} - ${format(new Date(endTs), "HH:mm")}`;
  }

  if (startTs) {
    return format(new Date(startTs), "dd/MM/yyyy HH:mm");
  }

  if (endTs) {
    return `Mwisho: ${format(new Date(endTs), "dd/MM/yyyy HH:mm")}`;
  }

  return "Tarehe haijawekwa";
}

export default function EventsPage() {
  const [activeStatus, setActiveStatus] = useState<VisibleEventStatus>("ongoing");
  const [selectedId, setSelectedId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobileSidebarTop = "var(--navbar-height, 64px)";
  const mobileSidebarHeight = "calc(100dvh - var(--navbar-height, 64px))";

  const { data, isLoading, error } = useApiQuery(
    () => fetchPublicEvents({ page: 1, limit: 500 }),
    []
  );

  const allEvents = useMemo<EventItem[]>(() => data?.data ?? [], [data]);
  const eventsWithResolvedStatus = useMemo<EventWithResolvedStatus[]>(() => {
    const nowTs = Date.now();
    return allEvents.map((item) => ({
      ...item,
      resolvedStatus: resolveEventStatus(item, nowTs)
    }));
  }, [allEvents]);

  const countsByStatus = useMemo(() => {
    const initial: Record<VisibleEventStatus, number> = {
      past: 0,
      ongoing: 0,
      upcoming: 0
    };

    eventsWithResolvedStatus.forEach((item) => {
      initial[item.resolvedStatus] += 1;
    });

    return initial;
  }, [eventsWithResolvedStatus]);

  const filteredItems = useMemo(() => {
    const items = eventsWithResolvedStatus.filter((item) => item.resolvedStatus === activeStatus);
    return sortEventsByStatus(items, activeStatus);
  }, [eventsWithResolvedStatus, activeStatus]);

  const activeStatusMeta = useMemo(
    () => statusCards.find((card) => card.key === activeStatus) || statusCards[0],
    [activeStatus]
  );

  useEffect(() => {
    if (!eventsWithResolvedStatus.length) return;

    if (!eventsWithResolvedStatus.some((item) => item.resolvedStatus === activeStatus)) {
      const nextStatus = statusCards.find((card) => countsByStatus[card.key] > 0)?.key;
      if (nextStatus) {
        setActiveStatus(nextStatus);
      }
    }
  }, [activeStatus, countsByStatus, eventsWithResolvedStatus]);

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
        <title>Matukio | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Matukio ya kanisa: yaliyopita, yanayoendelea, na yajayo." />
      </Helmet>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-0 sm:px-6">
        <div className="pb-3">
          <h1 className="text-center text-base font-extrabold uppercase tracking-[0.2em] text-slate-900 dark:text-white sm:text-lg">
            MATANGAZO YA KANISA
          </h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {statusCards.map((card) => {
              const active = activeStatus === card.key;
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
                </button>
              );
            })}
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

        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside
            className={`${
              sidebarOpen
                ? "fixed bottom-0 left-0 z-40 w-[21rem] max-w-[92vw] overflow-y-auto"
                : "hidden lg:block"
            } h-full rounded-r-2xl border border-slate-200 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-slate-900 lg:sticky lg:top-28 lg:h-fit lg:w-auto lg:rounded-2xl lg:bg-white/85 lg:dark:bg-slate-900/60`}
            style={sidebarOpen ? { top: mobileSidebarTop, height: mobileSidebarHeight } : undefined}
          >
            <div className="flex items-center justify-between lg:block">
              <h3 className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-church-600 dark:text-church-300">
                Orodha ya Matukio
              </h3>
              <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`event-menu-skeleton-${index}`}
                      className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-200/75 dark:border-white/10 dark:bg-white/[0.08]"
                    />
                  ))}
                </div>
              ) : null}

              {!isLoading && filteredItems.length === 0 ? (
                <p className="px-2 text-sm text-slate-500 dark:text-slate-300">{activeStatusMeta.emptyState}</p>
              ) : null}

              {filteredItems.map((item) => {
                const isActiveItem = selectedEvent?.id === item.id;
                const tone = getStatusTone(item.resolvedStatus);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`block w-full rounded-xl border p-2 text-left transition ${
                      isActiveItem
                        ? "border-church-400 bg-church-50 dark:border-church-500 dark:bg-church-950/45"
                        : "border-slate-200 bg-white/80 hover:border-church-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-church-500/35"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-16 w-20 rounded-lg border border-slate-200 object-cover dark:border-white/10"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-16 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[0.65rem] text-slate-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
                          No image
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {getListDateLabel(item)}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-600 dark:text-slate-300">
                          {item.summary || "Hakuna muhtasari"}
                        </p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>
                          {getStatusLabel(item.resolvedStatus)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {error ? (
              <div className="rounded-2xl border border-rose-300 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-400/45 dark:bg-rose-900/25 dark:text-rose-200">
                Imeshindikana kupakia matukio.
              </div>
            ) : null}

            {!error && !isLoading && !selectedEvent ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
                {activeStatusMeta.emptyState}
              </div>
            ) : null}

            {selectedEvent ? (
              <article className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/60 sm:p-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(selectedEvent.resolvedStatus)}`}
                      >
                        {getStatusLabel(selectedEvent.resolvedStatus)}
                      </span>
                    </div>
                    <h2 className="mt-3 break-words text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">
                      {selectedEvent.title}
                    </h2>
                    {selectedEvent.location ? (
                      <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        Mahali: {selectedEvent.location}
                      </p>
                    ) : null}
                  </div>
                </div>

                {selectedEvent.imageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                    <img
                      src={selectedEvent.imageUrl}
                      alt={selectedEvent.title}
                      className="h-[280px] w-full object-cover sm:h-[360px]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}

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

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold">Mwanzo:</span> {getDateTimeLabel(selectedEvent.startDate)}
                  </p>
                  <p>
                    <span className="font-semibold">Mwisho:</span> {getDateTimeLabel(selectedEvent.endDate)}
                  </p>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

