import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApiQuery";
import { createReport, fetchDepartments, fetchReports } from "@/services/adminService";
import { api } from "@/lib/api";
import AppDropdown from "@/components/common/AppDropdown";

type ReportForm = {
  departmentId: string;
  title: string;
  content: string;
  author: string;
  reportDate: string;
  attachments: FileList | null;
};

export default function AdminReportsPage() {
  const [departmentId, setDepartmentId] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ReportForm>({
    departmentId: "",
    title: "",
    content: "",
    author: "",
    reportDate: new Date().toISOString().slice(0, 10),
    attachments: null
  });

  const departmentsQuery = useApiQuery(() => fetchDepartments({ limit: 200 }), []);
  const reportsQuery = useApiQuery(
    () =>
      fetchReports({
        departmentId: departmentId || undefined,
        search: search || undefined,
        page: 1,
        limit: 30
      }),
    [departmentId, search]
  );

  const departments = useMemo(() => departmentsQuery.data?.data ?? [], [departmentsQuery.data]);
  const reports = useMemo(() => reportsQuery.data?.data ?? [], [reportsQuery.data]);
  const departmentOptions = useMemo(
    () => departments.map((department: any) => ({ value: department.id, label: department.name })),
    [departments]
  );
  const formDepartmentOptions = useMemo(
    () => [{ value: "", label: "Select department" }, ...departmentOptions],
    [departmentOptions]
  );
  const filterDepartmentOptions = useMemo(
    () => [{ value: "", label: "Filter by all departments" }, ...departmentOptions],
    [departmentOptions]
  );

  const handleSubmit = async () => {
    if (!form.departmentId || !form.title.trim()) {
      toast.error("Department and title are required.");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("departmentId", form.departmentId);
      payload.append("title", form.title);
      payload.append("content", form.content);
      payload.append("author", form.author);
      payload.append("reportDate", form.reportDate);
      Array.from(form.attachments || []).forEach((file) => payload.append("attachments", file));

      await createReport(payload);
      toast.success("Report created.");
      setForm((prev) => ({ ...prev, title: "", content: "", author: "", attachments: null }));
      await reportsQuery.refetch();
    } catch {
      toast.error("Failed to create report.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">Reports System</h1>
        <p className="text-sm text-slate-300">
          Add reports, attach PDF or images, categorize by department, and download attachments.
        </p>
      </header>

      <article className="rounded-md bg-white/[0.03] p-4">
        <h2 className="text-lg font-bold text-white">Add Report</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <AppDropdown
            value={form.departmentId}
            options={formDepartmentOptions}
            onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
          />
          <input
            className="form-input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            className="form-input"
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
          />
          <input
            className="form-input"
            type="date"
            value={form.reportDate}
            onChange={(e) => setForm((prev) => ({ ...prev, reportDate: e.target.value }))}
          />
          <textarea
            className="form-input md:col-span-2"
            rows={2}
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          />
          <input
            className="form-input md:col-span-2"
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={(e) => setForm((prev) => ({ ...prev, attachments: e.target.files }))}
          />
        </div>
        <button className="admin-btn-primary mt-3" type="button" onClick={() => void handleSubmit()}>
          Save report
        </button>
      </article>

      <div className="grid gap-3 md:grid-cols-2">
        <AppDropdown value={departmentId} options={filterDepartmentOptions} onChange={setDepartmentId} />
        <input
          className="form-input"
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {reports.map((report: any) => (
          <article key={report.id} className="rounded-md bg-white/[0.03] p-4">
            <h3 className="font-bold text-white">{report.title}</h3>
            <p className="text-xs text-slate-300">
              {report.author} | {format(new Date(report.reportDate), "dd MMM yyyy")}
            </p>
            <p className="mt-2 text-sm text-slate-300">{report.content}</p>
            {(report.attachments || []).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(report.attachments || []).map((attachment: any) => (
                  <a
                    key={attachment.id}
                    className="admin-btn-ghost px-2.5 py-1.5 text-xs"
                    href={`${api.defaults.baseURL}/admin/reports/${report.id}/attachments/${attachment.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download {attachment.originalName || attachment.fileName}
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
