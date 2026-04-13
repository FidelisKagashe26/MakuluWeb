import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { fetchPublicEvents, type EventItem } from "@/services/adminService";
import { useApiQuery } from "@/hooks/useApiQuery";

type VisibleEventStatus = "past" | "ongoing" | "upcoming";
type FilterKey = "all" | VisibleEventStatus;

type EventWithResolvedStatus = EventItem & {
  resolvedStatus: VisibleEventStatus;
};

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

function sortByStatus(items: EventWithResolvedStatus[], status: VisibleEventStatus) {
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const detailRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error } = useApiQuery(
    () => fetchPublicEvents({ page: 1, limit: 500 }),
    []
  );

  const allEvents = useMemo<EventItem[]>(() => data?.data ?? [], [data]);
  const resolvedEvents = useMemo<EventWithResolvedStatus[]>(() => {
    const nowTs = Date.now();
    return allEvents.map((item) => ({
      ...item,
      resolvedStatus: resolveEventStatus(item, nowTs)
    }));
  }, [allEvents]);

  const filteredBySearch = useMemo(
    () => resolvedEvents.filter((item) => eventMatchesSearch(item, search)),
    [resolvedEvents, search]
  );

  const counts = useMemo(() => {
    const initial = { all: filteredBySearch.length, ongoing: 0, upcoming: 0, past: 0 };
    filteredBySearch.forEach((item) => {
      initial[item.resolvedStatus] += 1;
    });
    return initial;
  }, [filteredBySearch]);

  const ongoingEvents = useMemo(
    () => sortByStatus(filteredBySearch.filter((item) => item.resolvedStatus === "ongoing"), "ongoing"),
    [filteredBySearch]
  );
  const upcomingEvents = useMemo(
    () => sortByStatus(filteredBySearch.filter((item) => item.resolvedStatus === "upcoming"), "upcoming"),
    [filteredBySearch]
  );
  const pastEvents = useMemo(
    () => sortByStatus(filteredBySearch.filter((item) => item.resolvedStatus === "past"), "past"),
    [filteredBySearch]
  );

  const heroEvent = useMemo(() => {
    if (activeFilter === "ongoing") return ongoingEvents[0] || null;
    if (activeFilter === "upcoming") return upcomingEvents[0] || null;
    if (activeFilter === "past") return pastEvents[0] || null;
    return ongoingEvents[0] || upcomingEvents[0] || pastEvents[0] || null;
  }, [activeFilter, ongoingEvents, upcomingEvents, pastEvents]);

  useEffect(() => {
    if (!selectedId) return;
    const exists = filteredBySearch.some((item) => item.id === selectedId);
    if (!exists) setSelectedId("");
  }, [filteredBySearch, selectedId]);

  const selectedEvent = useMemo(
    () => filteredBySearch.find((item) => item.id === selectedId) || null,
    [filteredBySearch, selectedId]
  );

  const openDetails = (eventId: string) => {
    setSelectedId(eventId);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 20);
  };

  const showOngoing = activeFilter === "all" || activeFilter === "ongoing";
  const showUpcoming = activeFilter === "all" || activeFilter === "upcoming";
  const showPast = activeFilter === "all" || activeFilter === "past";

  return (
    <>
      <Helmet>
        <title>Matukio | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Matukio ya kanisa: yaliyopita, yanayoendelea, na yajayo." />
      </Helmet>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-2 sm:px-6">
        <div className="pb-5 text-center">
          <h1 className="text-base font-extrabold uppercase tracking-[0.2em] text-slate-900 dark:text-white sm:text-lg">
            MATUKIO YA KANISA
          </h1>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
          {([
            { key: "all", label: "Zote" },
            { key: "ongoing", label: "Yanayoendelea" },
            { key: "upcoming", label: "Yajayo" },
            { key: "past", label: "Yaliyopita" }
          ] as Array<{ key: FilterKey; label: string }>).map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveFilter(chip.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-church-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                <span>{chip.label}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[0.65rem] ${active ? "bg-white/20 text-white" : "bg-white/75 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                  {counts[chip.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mb-8 w-full max-w-2xl">
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

        {!isLoading && !heroEvent ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
            Hakuna matukio ya kuonyesha kwa sasa.
          </div>
        ) : null}

        {!isLoading && heroEvent ? (
          <section className="mb-12 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/60 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">Tukio Kuu</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  {getStatusLabel(heroEvent.resolvedStatus)}
                </h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusTone(heroEvent.resolvedStatus)}`}>
                {getStatusLabel(heroEvent.resolvedStatus)}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                {heroEvent.imageUrl ? (
                  <img
                    src={heroEvent.imageUrl}
                    alt={heroEvent.title}
                    className="h-[280px] w-full object-cover sm:h-[360px]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-[280px] w-full items-center justify-center text-sm text-slate-500 dark:text-slate-300 sm:h-[360px]">
                    No image
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                    {heroEvent.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {heroEvent.summary || "Hakuna muhtasari"}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-semibold">Mwanzo:</span> {getDateTimeLabel(heroEvent.startDate)}
                    </p>
                    <p>
                      <span className="font-semibold">Mwisho:</span> {getDateTimeLabel(heroEvent.endDate)}
                    </p>
                    <p>
                      <span className="font-semibold">Mahali:</span> {heroEvent.location || "Haijawekwa"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDetails(heroEvent.id)}
                  className="w-full rounded-xl bg-church-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-church-800"
                >
                  Soma Tukio Hili
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {showUpcoming ? (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Yajayo</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 mx-6" />
            </div>
            {upcomingEvents.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <article
                    key={event.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-church-300 dark:border-white/10 dark:bg-slate-900/60"
                  >
                    <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-300">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(event.resolvedStatus)}`}>
                        {getStatusLabel(event.resolvedStatus)}
                      </span>
                      <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900 dark:text-white">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{getCompactDateLabel(event)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {event.summary || "Hakuna muhtasari"}
                      </p>
                      <button
                        type="button"
                        onClick={() => openDetails(event.id)}
                        className="mt-3 w-full rounded-lg bg-church-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-church-800"
                      >
                        Soma Tukio
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
                Hakuna tukio la yajayo kwa sasa.
              </div>
            )}
          </section>
        ) : null}

        {showOngoing ? (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Yanayoendelea</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 mx-6" />
            </div>
            {ongoingEvents.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ongoingEvents.map((event) => (
                  <article
                    key={event.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-church-300 dark:border-white/10 dark:bg-slate-900/60"
                  >
                    <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-300">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(event.resolvedStatus)}`}>
                        {getStatusLabel(event.resolvedStatus)}
                      </span>
                      <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900 dark:text-white">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{getCompactDateLabel(event)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {event.summary || "Hakuna muhtasari"}
                      </p>
                      <button
                        type="button"
                        onClick={() => openDetails(event.id)}
                        className="mt-3 w-full rounded-lg bg-church-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-church-800"
                      >
                        Soma Tukio
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
                Hakuna tukio linaloendelea kwa sasa.
              </div>
            )}
          </section>
        ) : null}

        {showPast ? (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Yaliyopita</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 mx-6" />
            </div>
            {pastEvents.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pastEvents.map((event) => (
                  <article
                    key={event.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-church-300 dark:border-white/10 dark:bg-slate-900/60"
                  >
                    <div className="h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-300">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                        {getCompactDateLabel(event)}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                        {event.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => openDetails(event.id)}
                        className="mt-2 w-full rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Soma Tukio
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600 dark:border-white/20 dark:bg-slate-900/45 dark:text-slate-300">
                Hakuna tukio lililopita kwa sasa.
              </div>
            )}
          </section>
        ) : null}

        <div ref={detailRef} className="mt-6">
          {selectedEvent ? (
            <article className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/60 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusTone(selectedEvent.resolvedStatus)}`}>
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

