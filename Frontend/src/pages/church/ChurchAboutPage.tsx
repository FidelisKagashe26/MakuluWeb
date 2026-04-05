import { Helmet } from "react-helmet-async";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api";
import { resolvePublicUploadUrl } from "@/services/adminService";

type SiteSettingsResponse = {
  ok: boolean;
  data: Record<string, unknown>;
};

export default function ChurchAboutPage() {
  const { data, isLoading } = useApiQuery(async () => {
    const response = await api.get<SiteSettingsResponse>("/public/site-settings", {
      params: { t: Date.now() }
    });
    return response.data?.data || {};
  }, []);

  const about = (data as any)?.aboutChurch || {};
  const title = String(about?.title || "");
  const content = String(about?.content || "");
  const imageUrl = resolvePublicUploadUrl(String(about?.imageUrl || ""));
  const imageAlt = String(about?.imageAlt || "Kuhusu kanisa");

  return (
    <>
      <Helmet>
        <title>Kuhusu Kanisa | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content={content || "Taarifa kuhusu kanisa."} />
      </Helmet>

      <section className="space-y-4">
        <div className="pb-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">KANISA</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {title || "Kuhusu Kanisa"}
          </h2>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
        </div>

        {isLoading ? (
          <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]" />
        ) : null}

        {!isLoading && !title && !content && !imageUrl ? (
          <div className="border-y border-slate-200 py-4 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
            No data
          </div>
        ) : null}

        {!isLoading && (title || content || imageUrl) ? (
          <article className="space-y-4 border-y border-slate-200 py-4 dark:border-white/15">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageAlt}
                loading="lazy"
                decoding="async"
                className="h-72 w-full rounded-lg object-cover"
              />
            ) : null}

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title || "No data"}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {content || "No data"}
              </p>
            </div>
          </article>
        ) : null}
      </section>
    </>
  );
}
