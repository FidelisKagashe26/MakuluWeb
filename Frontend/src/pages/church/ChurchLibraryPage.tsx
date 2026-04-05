import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api";
import { resolvePublicUploadUrl } from "@/services/adminService";

type SiteSettingsResponse = {
  ok: boolean;
  data: Record<string, unknown>;
};

type LibraryItem = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  fileName: string;
  uploadedAt: string;
};

function normalizeLibraryItems(input: unknown): LibraryItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item: any, index) => ({
      id: String(item?.id || `library-item-${index + 1}`),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      pdfUrl: resolvePublicUploadUrl(String(item?.pdfUrl || "").trim()),
      fileName: String(item?.fileName || "").trim(),
      uploadedAt: String(item?.uploadedAt || "").trim()
    }))
    .filter((item) => item.title && item.pdfUrl);
}

export default function ChurchLibraryPage() {
  const { data, isLoading } = useApiQuery(async () => {
    const response = await api.get<SiteSettingsResponse>("/public/site-settings", {
      params: { t: Date.now() }
    });
    return response.data?.data || {};
  }, []);

  const items = normalizeLibraryItems((data as any)?.libraryItems);

  return (
    <>
      <Helmet>
        <title>Maktaba | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content="Maktaba ya PDF za kanisa." />
      </Helmet>

      <section className="space-y-4">
        <div className="pb-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-church-700">KANISA</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Maktaba</h2>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`library-loading-${index}`}
                className="aspect-[210/297] animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <div className="border-y border-slate-200 py-4 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
            No data
          </div>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-4 2xl:grid-cols-5">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="aspect-[210/297] w-full overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                  <iframe
                    src={`${item.pdfUrl}#page=1&view=FitV&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
                    title={item.title}
                    className="-mr-5 h-full w-[calc(100%+20px)] max-w-none border-0 pointer-events-none"
                    tabIndex={-1}
                    scrolling="no"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.description || "No data"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.uploadedAt ? format(new Date(item.uploadedAt), "dd MMM yyyy") : "No date"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={item.pdfUrl}
                      download={item.fileName || `${item.title}.pdf`}
                      className="inline-flex rounded-lg bg-church-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-church-800"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
