import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api";

type SiteSettingsResponse = {
  ok: boolean;
  data: Record<string, unknown>;
};

export default function ChurchMapPage() {
  const [isStartingJourney, setIsStartingJourney] = useState(false);

  const { data, isLoading } = useApiQuery(async () => {
    const response = await api.get<SiteSettingsResponse>("/public/site-settings", {
      params: { t: Date.now() }
    });
    return response.data?.data || {};
  }, []);

  const mapData = useMemo(() => {
    const lat = Number((data as any)?.mapLocation?.latitude);
    const lng = Number((data as any)?.mapLocation?.longitude);
    const zoom = Number((data as any)?.mapLocation?.zoom || 15);
    const label = String((data as any)?.mapLocation?.label || "Kanisa");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&z=${Number.isFinite(zoom) ? zoom : 15}&output=embed`;
    const openUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    return { lat, lng, zoom, label, embedUrl, openUrl };
  }, [data]);

  const handleStartJourney = () => {
    if (!mapData) return;

    const destination = `${mapData.lat},${mapData.lng}`;
    const openWithDestinationOnly = () => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    if (!navigator.geolocation) {
      openWithDestinationOnly();
      return;
    }

    setIsStartingJourney(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
        window.open(url, "_blank", "noopener,noreferrer");
        setIsStartingJourney(false);
      },
      () => {
        openWithDestinationOnly();
        setIsStartingJourney(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <>
      <Helmet>
        <title>Ramani | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Ramani ya live location ya kanisa." />
      </Helmet>

      <section className="space-y-4">
        <div className="pb-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">KANISA</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Ramani</h2>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
        </div>

        {isLoading ? (
          <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]" />
        ) : null}

        {!isLoading && !mapData ? (
          <div className="border-y border-slate-200 py-4 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
            No data
          </div>
        ) : null}

        {!isLoading && mapData ? (
          <div className="space-y-3 border-y border-slate-200 py-4 dark:border-white/15">
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/15">
              <iframe
                title="Church map"
                src={mapData.embedUrl}
                className="h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">{mapData.label}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {mapData.lat}, {mapData.lng} (zoom {mapData.zoom})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartJourney}
                  disabled={isStartingJourney}
                  className="inline-flex rounded-lg bg-church-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-church-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isStartingJourney ? "Inatafuta location..." : "Anza Safari"}
                </button>
                <a
                  href={mapData.openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Fungua Google Maps
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
