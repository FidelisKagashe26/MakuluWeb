import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { CalendarDays, Clock3, MapPin, Search } from "lucide-react";
import { fetchPublicEvents, type EventItem } from "@/services/adminService";
import { useApiQuery } from "@/hooks/useApiQuery";

type VisibleEventStatus = "past" | "ongoing" | "upcoming";

type EventWithResolvedStatus = EventItem & {
  resolvedStatus: VisibleEventStatus;
  normalizedCategory: string;
};

function toTs(value?: string) {
  const ts = new Date(String(value || "")).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function resolveEventStatus(item: EventItem, nowTs: number): VisibleEventStatus {
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

function normalizeCategory(category?: string) {
  const value = String(category || "").trim();
  return value || "General";
}

function eventMatchesSearch(item: EventWithResolvedStatus, search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    String(item.title || "").toLowerCase().includes(q) ||
    String(item.summary || "").toLowerCase().includes(q) ||
    String(item.content || "").toLowerCase().includes(q) ||
    String(item.normalizedCategory || "").toLowerCase().includes(q) ||
    String(item.actionLabel || "").toLowerCase().includes(q) ||
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
    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }
    return toTs(left.startDate) - toTs(right.startDate);
  });
}

function getStatusTitle(status: VisibleEventStatus) {
  if (status === "ongoing") return "Yanayoendelea";
  if (status === "upcoming") return "Yajayo";
  return "Yaliyopita";
}

function getDateLabel(value?: string) {
  const ts = toTs(value);
  if (!ts) return "Tarehe haijawekwa";
  return format(new Date(ts), "dd MMM yyyy");
}

function getDateTimeLabel(value?: string) {
  const ts = toTs(value);
  if (!ts) return "Haijawekwa";
  return format(new Date(ts), "dd MMM yyyy, HH:mm");
}

function getTimeLabel(value?: string) {
  const ts = toTs(value);
  if (!ts) return "Haijawekwa";
  return format(new Date(ts), "HH:mm");
}

function getMonthLabel(value?: string) {
  const ts = toTs(value);
  if (!ts) return "--";
  return format(new Date(ts), "MMM").toUpperCase();
}

function getDayLabel(value?: string) {
  const ts = toTs(value);
  if (!ts) return "--";
  return format(new Date(ts), "dd");
}

function selectHeroEvent(
  ongoingEvents: EventWithResolvedStatus[],
  upcomingEvents: EventWithResolvedStatus[],
  pastEvents: EventWithResolvedStatus[]
) {
  const featuredOngoing = ongoingEvents.find((item) => item.isFeatured);
  if (featuredOngoing) return featuredOngoing;
  if (ongoingEvents[0]) return ongoingEvents[0];

  const featuredUpcoming = upcomingEvents.find((item) => item.isFeatured);
  if (featuredUpcoming) return featuredUpcoming;
  if (upcomingEvents[0]) return upcomingEvents[0];

  const featuredPast = pastEvents.find((item) => item.isFeatured);
  if (featuredPast) return featuredPast;
  return pastEvents[0] || null;
}

function upcomingActionLabel(event: EventWithResolvedStatus) {
  const label = String(event.actionLabel || "").trim();
  if (label) return label;
  return "Soma Tukio";
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const detailRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error } = useApiQuery(
    () => fetchPublicEvents({ page: 1, limit: 500 }),
    []
  );

  const allEvents = useMemo<EventWithResolvedStatus[]>(() => {
    const nowTs = Date.now();
    const source = data?.data ?? [];
    return source.map((item) => ({
      ...item,
      resolvedStatus: resolveEventStatus(item, nowTs),
      normalizedCategory: normalizeCategory(item.category)
    }));
  }, [data]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((item) => {
      set.add(item.normalizedCategory);
    });
    return Array.from(set).sort((left, right) => left.localeCompare(right));
  }, [allEvents]);

  useEffect(() => {
    if (activeCategory === "all") return;
    if (categories.includes(activeCategory)) return;
    setActiveCategory("all");
  }, [activeCategory, categories]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      if (activeCategory !== "all" && item.normalizedCategory !== activeCategory) return false;
      return eventMatchesSearch(item, search);
    });
  }, [activeCategory, allEvents, search]);

  const ongoingEvents = useMemo(
    () => sortByStatus(filteredEvents.filter((item) => item.resolvedStatus === "ongoing"), "ongoing"),
    [filteredEvents]
  );
  const upcomingEvents = useMemo(
    () => sortByStatus(filteredEvents.filter((item) => item.resolvedStatus === "upcoming"), "upcoming"),
    [filteredEvents]
  );
  const pastEvents = useMemo(
    () => sortByStatus(filteredEvents.filter((item) => item.resolvedStatus === "past"), "past"),
    [filteredEvents]
  );

  const heroEvent = useMemo(
    () => selectHeroEvent(ongoingEvents, upcomingEvents, pastEvents),
    [ongoingEvents, upcomingEvents, pastEvents]
  );

  useEffect(() => {
    if (!selectedId) return;
    const exists = filteredEvents.some((item) => item.id === selectedId);
    if (!exists) setSelectedId("");
  }, [filteredEvents, selectedId]);

  const selectedEvent = useMemo(
    () => filteredEvents.find((item) => item.id === selectedId) || null,
    [filteredEvents, selectedId]
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
        <meta
          name="description"
          content="Matukio ya kanisa yaliyopangwa kwa Yanayoendelea, Yajayo na Yaliyopita."
        />
      </Helmet>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-0 sm:px-6 lg:px-8">
        <header className="pb-5 text-center">
          <h1 className="text-base font-extrabold uppercase tracking-[0.2em] text-slate-900 dark:text-white sm:text-lg">
            MATUKIO YA KANISA
          </h1>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl bg-rose-100/75 p-4 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
            Imeshindikana kupakia matukio.
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-5">
            <div className="h-[340px] animate-pulse rounded-3xl bg-slate-200/85 dark:bg-white/[0.08] sm:h-[480px]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`events-upcoming-skeleton-${index}`}
                  className="h-80 animate-pulse rounded-2xl bg-slate-200/85 dark:bg-white/[0.08]"
                />
              ))}
            </div>
          </div>
        ) : null}

        {!isLoading && !heroEvent ? (
          <div className="rounded-2xl bg-white/85 p-5 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
            Hakuna matukio ya kuonyesha kwa sasa.
          </div>
        ) : null}

        {!isLoading && heroEvent ? (
          <>
            <section className="mb-10">
              <div className="mb-6 flex items-end justify-between gap-3">
                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-church-700 dark:text-church-300">
                    HALI YA SASA
                  </span>
                  <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                    {getStatusTitle(heroEvent.resolvedStatus)}
                  </h2>
                </div>
                {heroEvent.resolvedStatus === "ongoing" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    Live
                  </span>
                ) : null}
              </div>

              <article className="relative overflow-hidden rounded-[1.75rem] bg-slate-200 dark:bg-slate-900">
                {heroEvent.imageUrl ? (
                  <img
                    src={heroEvent.imageUrl}
                    alt={heroEvent.title}
                    className="h-[340px] w-full object-cover sm:h-[500px]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-[340px] w-full bg-slate-300 dark:bg-slate-800 sm:h-[500px]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,0.92),rgba(2,6,23,0.42),rgba(2,6,23,0.08))]" />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-church-700/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white">
                      {heroEvent.normalizedCategory}
                    </span>
                    {heroEvent.location ? (
                      <span className="rounded-full bg-white/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur">
                        {heroEvent.location}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                    {heroEvent.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
                    {heroEvent.summary || "Hakuna muhtasari wa tukio hili kwa sasa."}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-200 sm:text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {getDateLabel(heroEvent.startDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {getTimeLabel(heroEvent.startDate)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDetails(heroEvent.id)}
                    className="mt-6 rounded-xl bg-church-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-church-800"
                  >
                    {upcomingActionLabel(heroEvent)}
                  </button>
                </div>
              </article>
            </section>

            <section className="mb-10 space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                    Chuja kwa:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === "all"
                        ? "bg-church-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    Matukio yote
                  </button>
                  {categories.map((category) => {
                    const active = activeCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "bg-church-700 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                <label className="relative block w-full lg:w-[340px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tafuta tukio..."
                    className="w-full rounded-xl bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none ring-1 ring-slate-300 transition focus:ring-church-500 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/15 dark:focus:ring-church-400"
                  />
                </label>
              </div>
            </section>

            <section className="mb-14">
              <div className="mb-7 flex items-center gap-3">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Yajayo</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    if (upcomingEvents[0]) openDetails(upcomingEvents[0].id);
                  }}
                  className="text-sm font-semibold text-church-700 hover:underline dark:text-church-300"
                >
                  Kalenda
                </button>
              </div>

              {upcomingEvents.length ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event, index) => (
                    <article
                      key={event.id}
                      className={`overflow-hidden rounded-2xl bg-white/95 transition duration-300 hover:-translate-y-1 dark:bg-white/[0.05] ${
                        index === 1 ? "md:-mt-6" : ""
                      }`}
                    >
                      <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
                        )}

                        <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1 text-center backdrop-blur">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-church-700">
                            {getMonthLabel(event.startDate)}
                          </p>
                          <p className="text-xl font-black text-slate-900">{getDayLabel(event.startDate)}</p>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-church-700 dark:text-church-300">
                            {event.normalizedCategory}
                          </span>
                          <span className="text-xs font-semibold text-church-700 dark:text-church-300">
                            {upcomingActionLabel(event)}
                          </span>
                        </div>

                        <h3 className="line-clamp-2 text-2xl font-black leading-snug tracking-tight text-slate-900 dark:text-white">
                          {event.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                          {event.summary || "Hakuna muhtasari kwa tukio hili."}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location || "Mahali haijawekwa"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {getTimeLabel(event.startDate)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openDetails(event.id)}
                          className="mt-5 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-church-700 transition hover:bg-church-700 hover:text-white dark:bg-white/[0.08] dark:text-church-200 dark:hover:bg-church-700 dark:hover:text-white"
                        >
                          {upcomingActionLabel(event)}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/80 p-5 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                  Hakuna tukio la yajayo kwa sasa.
                </div>
              )}
            </section>

            <section>
              <div className="mb-6 flex items-center gap-3 opacity-80">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Yaliyopita</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    if (pastEvents[0]) openDetails(pastEvents[0].id);
                  }}
                  className="text-sm font-semibold text-slate-600 hover:underline dark:text-slate-300"
                >
                  Archive
                </button>
              </div>

              {pastEvents.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {pastEvents.map((event) => (
                    <article
                      key={event.id}
                      className="overflow-hidden rounded-2xl bg-white/92 transition hover:opacity-100 dark:bg-white/[0.05]"
                    >
                      <div className="h-28 w-full overflow-hidden bg-slate-100 grayscale-[0.4] dark:bg-slate-800">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                          {getDateLabel(event.endDate || event.startDate)}
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                          {event.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => openDetails(event.id)}
                          className="mt-2 w-full rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/[0.08] dark:text-slate-200 dark:hover:bg-white/[0.16]"
                        >
                          Soma Tukio
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/80 p-5 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                  Hakuna tukio lililopita kwa sasa.
                </div>
              )}
            </section>

            <section ref={detailRef} className="mt-12">
              {selectedEvent ? (
                <article className="overflow-hidden rounded-2xl bg-white p-4 shadow-soft dark:bg-white/[0.06] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-church-700 dark:text-church-300">
                        {selectedEvent.normalizedCategory}
                      </p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {selectedEvent.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId("")}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/[0.1] dark:text-slate-100 dark:hover:bg-white/[0.16]"
                    >
                      Funga Maelezo
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold">Mwanzo:</span> {getDateTimeLabel(selectedEvent.startDate)}
                    </p>
                    <p>
                      <span className="font-semibold">Mwisho:</span> {getDateTimeLabel(selectedEvent.endDate)}
                    </p>
                    <p>
                      <span className="font-semibold">Mahali:</span> {selectedEvent.location || "Haijawekwa"}
                    </p>
                    <p>
                      <span className="font-semibold">Aina:</span> {selectedEvent.normalizedCategory}
                    </p>
                  </div>

                  {selectedEvent.imageUrl ? (
                    <div className="mt-5 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      <img
                        src={selectedEvent.imageUrl}
                        alt={selectedEvent.title}
                        className="h-[260px] w-full object-cover sm:h-[360px]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}

                  {selectedEvent.summary ? (
                    <p className="mt-5 rounded-xl bg-slate-100/90 p-3 text-sm text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
                      {selectedEvent.summary}
                    </p>
                  ) : null}

                  <div className="mt-5 w-full">
                    <article
                      className="prose prose-slate max-w-none break-words text-sm dark:prose-invert sm:text-base"
                      dangerouslySetInnerHTML={{ __html: selectedEvent.content || "" }}
                    />
                  </div>
                </article>
              ) : (
                <div className="rounded-2xl bg-white/85 p-4 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                  Bonyeza card yoyote kisha <span className="font-semibold">Soma Tukio</span> ili kufungua maelezo kamili.
                </div>
              )}
            </section>
          </>
        ) : null}
      </section>
    </>
  );
}

