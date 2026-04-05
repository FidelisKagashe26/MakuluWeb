import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useApiQuery } from "@/hooks/useApiQuery";
import { fetchPublicDepartmentDetail } from "@/services/adminService";

export default function DepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { data: department, isLoading } = useApiQuery(
    () => fetchPublicDepartmentDetail(String(departmentId || "")),
    [departmentId],
    { enabled: Boolean(departmentId) }
  );

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">Loading...</p>
      </section>
    );
  }

  if (!department) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Idara haijapatikana</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No data</p>
        <Link
          to="/idara"
          className="mt-4 inline-flex rounded-lg bg-church-700 px-3 py-2 text-sm font-semibold text-white hover:bg-church-800"
        >
          Rudi idara zote
        </Link>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <title>{department.name} | DODOMA MAKULU SDA CHURCH</title>
        <meta name="description" content={department.description || "No data"} />
      </Helmet>

      <section className="space-y-4">
        <Link
          to="/idara"
          className="inline-flex rounded-lg border border-church-300 px-3 py-2 text-sm font-semibold text-church-700 hover:bg-church-50 dark:border-church-800 dark:text-church-300 dark:hover:bg-slate-800"
        >
          {"<-"} Rudi idara zote
        </Link>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
          {department.imageUrl ? (
            <img
              src={department.imageUrl}
              alt={department.name}
              loading="lazy"
              decoding="async"
              className="h-56 w-full object-cover md:h-72"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-slate-200 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300 md:h-72">
              No image
            </div>
          )}
          <div className="space-y-3 p-5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{department.name}</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300">{department.description || "No data"}</p>
          </div>
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kamati</h3>
            <div className="mt-3 space-y-3">
              {department.committee?.length ? (
                department.committee.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-church-700 dark:text-church-300">
                      {member.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{member.description || "No data"}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  No data
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reports</h3>
            <div className="mt-3 space-y-3">
              {department.reports?.length ? (
                department.reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{report.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {report.reportDate ? format(new Date(report.reportDate), "dd MMM yyyy") : "No date"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-church-700 dark:text-church-300">
                      {report.author || "No data"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{report.content || "No data"}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  No data
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
