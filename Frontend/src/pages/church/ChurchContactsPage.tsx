import { Helmet } from "react-helmet-async";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api";

type SiteSettingsResponse = {
  ok: boolean;
  data: Record<string, unknown>;
};

const socialLabels: Array<{ key: string; label: string }> = [
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" }
];

export default function ChurchContactsPage() {
  const { data, isLoading } = useApiQuery(async () => {
    const response = await api.get<SiteSettingsResponse>("/public/site-settings", {
      params: { t: Date.now() }
    });
    return response.data?.data || {};
  }, []);

  const contact = (data as any)?.contactInfo || {};
  const socials = (data as any)?.socialLinks || {};

  return (
    <>
      <Helmet>
        <title>Contacts | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Mawasiliano rasmi ya kanisa kutoka backend." />
      </Helmet>

      <section className="space-y-4">
        <div className="pb-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">KANISA</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Contacts</h2>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-lg border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]" />
            <div className="h-12 animate-pulse rounded-lg border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]" />
            <div className="h-12 animate-pulse rounded-lg border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]" />
          </div>
        ) : null}

        {!isLoading &&
        !contact?.phone &&
        !contact?.email &&
        !contact?.address &&
        !socialLabels.some((item) => String(socials?.[item.key] || "").trim()) ? (
          <div className="border-y border-slate-200 py-4 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
            No data
          </div>
        ) : null}

        {!isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="border-y border-slate-200 py-4 dark:border-white/15">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mawasiliano Muhimu</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p className="border-b border-slate-200 pb-2 dark:border-white/10">
                  Simu: {String(contact?.phone || "No data")}
                </p>
                <p className="border-b border-slate-200 pb-2 dark:border-white/10">
                  Email: {String(contact?.email || "No data")}
                </p>
                <p>Anuani: {String(contact?.address || "No data")}</p>
              </div>
            </article>

            <article className="border-y border-slate-200 py-4 dark:border-white/15">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Social Links</h3>
              <div className="mt-3 space-y-2">
                {socialLabels.map((item) => {
                  const href = String(socials?.[item.key] || "").trim();
                  return href ? (
                    <div key={item.key} className="border-b border-slate-200 pb-2 dark:border-white/10">
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-semibold text-church-700 transition hover:text-church-800 dark:text-church-300 dark:hover:text-church-200"
                      >
                        {item.label}
                      </a>
                    </div>
                  ) : (
                    <p key={item.key} className="border-b border-slate-200 pb-2 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {item.label}: No data
                    </p>
                  );
                })}
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </>
  );
}
