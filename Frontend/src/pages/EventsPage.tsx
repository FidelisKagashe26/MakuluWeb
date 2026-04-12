import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
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

function eventMatchesSearch(item: EventItem, search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    String(item.title || "").toLowerCase().includes(q) ||
    String(item.summary || "").toLowerCase().includes(q) ||
    String(item.content || "").toLowerCase().includes(q) ||
    String(item.location || "").toLowerCase().includes(q)
  );
}

function getCompactDateLabel(item: EventItem) {
  const startTs = toTs(item.startDate);
  const endTs = toTs(item.endDate);

  if (startTs && endTs) {
    return `${format(new Date(startTs), "dd/MM/yyyy HH:mm")} - ${format(new Date(endTs), "HH:mm")}`;
  }
  if (startTs) return format(new Date(startTs), "dd/MM/yyyy HH:mm");
  if (endTs) return `Mwisho: ${format(new Date(endTs), "dd/MM/yyyy HH:mm")}`;
  return "Tarehe haijawekwa";
}

export default function EventsPage() {
  const [activeStatus, setActiveStatus] = useState<VisibleEventStatus>("ongoing");
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const detailRef = useRef<HTMLDivElement | null>(null);

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
      if (eventMatchesSearch(item, search)) {
        initial[item.resolvedStatus] += 1;
      }
    });

    return initial;
  }, [eventsWithResolvedStatus, search]);

  const filteredItems = useMemo(() => {
    const items = eventsWithResolvedStatus
      .filter((item) => item.resolvedStatus === activeStatus)
      .filter((item) => eventMatchesSearch(item, search));
    return sortEventsByStatus(items, activeStatus);
  }, [eventsWithResolvedStatus, activeStatus, search]);

  const activeStatusMeta = useMemo(
    () => statusCards.find((card) => card.key === activeStatus) || statusCards[0],
    [activeStatus]
  );

  useEffect(() => {
    if (!eventsWithResolvedStatus.length) return;

    if (!eventsWithResolvedStatus.some((item) => item.resolvedStatus === activeStatus && eventMatchesSearch(item, search))) {
      const nextStatus = statusCards.find((card) => countsByStatus[card.key] > 0)?.key;
      if (nextStatus) {
        setActiveStatus(nextStatus);
      }
    }
  }, [activeStatus, countsByStatus, eventsWithResolvedStatus, search]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedId("");
      return;
    }

    if (selectedId && filteredItems.some((item) => item.id === selectedId)) return;
    setSelectedId("");
  }, [filteredItems, selectedId]);

  const selectedEvent = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) || null,
    [filteredItems, selectedId]
  );

  const openDetails = (eventId: string) => {
    setSelectedId(eventId);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 20);
  };

  return (
    <>
      <Helmet>
        <title>Matukio | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Matukio ya kanisa: yaliyopita, yanayoendelea, na yajayo." />
      </Helmet>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-0 sm:px-6">
        <div className="pb-4">
          <h1 className="text-center text-base font-extrabold uppercase tracking-[0.2em] text-slate-900 dark:text-white sm:text-lg">
            MATUKIO YA KANISA
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {statusCards.map((card) => {
              const active = activeStatus === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setActiveStatus(card.key)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-church-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <span>{card.title}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[0.65rem] ${active ? "bg-white/20 text-white" : "bg-white/75 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                    {countsByStatus[card.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-3 w-full max-w-2xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tafuta tukio kwa jina, maelezo au location..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-church-500 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-church-400"
              />
            </label>
          </div>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-300 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-400/45 dark:bg-rose-900/25 dark:text-rose-200">
            Imeshindikana kupakia matukio.
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`events-card-skeleton-${index}`}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/75 dark:border-white/10 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
            {activeStatusMeta.emptyState}
          </div>
        ) : null}

        {!isLoading && filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:border-church-300 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-church-500/40"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-300">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(item.resolvedStatus)}`}>
                    {getStatusLabel(item.resolvedStatus)}
                  </span>
                  <h2 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-300">{getCompactDateLabel(item)}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.summary || "Hakuna muhtasari"}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-300/90">{item.location || "Mahali haijawekwa"}</p>
                  <button
                    type="button"
                    onClick={() => openDetails(item.id)}
                    className="mt-3 w-full rounded-lg bg-church-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-church-800"
                  >
                    Soma Tukio
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div ref={detailRef} className="mt-6">
          {selectedEvent ? (
            <article className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/60 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(selectedEvent.resolvedStatus)}`}
                >
                  {getStatusLabel(selectedEvent.resolvedStatus)}
                </span>
              </div>

              <h2 className="mt-3 break-words text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                {selectedEvent.title}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Mahali: {selectedEvent.location || "Haijawekwa"}
              </p>

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
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
              Bonyeza <span className="font-semibold">Soma Tukio</span> kwenye card yoyote juu ili kufungua maelezo kamili.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

