import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  createCommitteeMember,
  createDepartment,
  createDepartmentReport,
  deleteCommitteeMember,
  deleteDepartment,
  deleteDepartmentReport,
  fetchDepartmentDetail,
  fetchDepartments,
  updateCommitteeMember,
  updateDepartment
} from "@/services/adminService";
import { useAuth } from "@/context/AuthContext";
import AppDropdown from "@/components/common/AppDropdown";

type DepartmentForm = {
  name: string;
  description: string;
  imageUrl: string;
};

type CommitteeForm = {
  name: string;
  title: string;
  description: string;
};

type ReportForm = {
  title: string;
  content: string;
  author: string;
  reportDate: string;
};

const initialForm: DepartmentForm = { name: "", description: "", imageUrl: "" };
const initialCommitteeForm: CommitteeForm = { name: "", title: "", description: "" };
const initialReportForm: ReportForm = {
  title: "",
  content: "",
  author: "",
  reportDate: new Date().toISOString().slice(0, 10)
};

export default function AdminDepartmentsPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<DepartmentForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [committeeForm, setCommitteeForm] = useState<CommitteeForm>(initialCommitteeForm);
  const [reportForm, setReportForm] = useState<ReportForm>(initialReportForm);
  const [editingCommitteeId, setEditingCommitteeId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetchDepartments({ search: debouncedSearch, page, limit: 8 }),
    [debouncedSearch, page]
  );
  const detailQuery = useApiQuery(
    () => fetchDepartmentDetail(selectedDepartmentId),
    [selectedDepartmentId],
    { enabled: Boolean(selectedDepartmentId) }
  );

  const canCreate = hasPermission("create");
  const canUpdate = hasPermission("update");
  const canDelete = hasPermission("delete");

  const rows = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const departmentOptions = useMemo(
    () => [{ value: "", label: "Select department" }, ...rows.map((department: any) => ({ value: department.id, label: department.name }))],
    [rows]
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    try {
      if (editingId) {
        await updateDepartment(editingId, form);
        toast.success("Department updated.");
      } else {
        await createDepartment(form);
        toast.success("Department created.");
      }
      resetForm();
      await refetch();
    } catch {
      toast.error("Failed to save department.");
    }
  };

  const handleEdit = (department: any) => {
    setEditingId(department.id);
    setForm({
      name: department.name ?? "",
      description: department.description ?? "",
      imageUrl: department.imageUrl ?? ""
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success("Department deleted.");
      await refetch();
    } catch {
      toast.error("Failed to delete department.");
    }
  };

  const submitCommittee = async () => {
    if (!selectedDepartmentId || !committeeForm.name.trim()) {
      toast.error("Select a department and enter member name.");
      return;
    }

    try {
      if (editingCommitteeId) {
        await updateCommitteeMember(selectedDepartmentId, editingCommitteeId, committeeForm);
        toast.success("Committee member updated.");
      } else {
        await createCommitteeMember(selectedDepartmentId, committeeForm);
        toast.success("Committee member added.");
      }
      setCommitteeForm(initialCommitteeForm);
      setEditingCommitteeId(null);
      await detailQuery.refetch();
      await refetch();
    } catch {
      toast.error("Failed to save committee member.");
    }
  };

  const removeCommittee = async (memberId: string) => {
    if (!selectedDepartmentId) return;
    if (!window.confirm("Delete this committee member?")) return;
    try {
      await deleteCommitteeMember(selectedDepartmentId, memberId);
      toast.success("Committee member deleted.");
      await detailQuery.refetch();
      await refetch();
    } catch {
      toast.error("Failed to delete committee member.");
    }
  };

  const submitDepartmentReport = async () => {
    if (!selectedDepartmentId || !reportForm.title.trim()) {
      toast.error("Select a department and provide a report title.");
      return;
    }
    try {
      await createDepartmentReport(selectedDepartmentId, reportForm);
      toast.success("Department report added.");
      setReportForm(initialReportForm);
      await detailQuery.refetch();
      await refetch();
    } catch {
      toast.error("Failed to add department report.");
    }
  };

  const removeDepartmentReport = async (reportId: string) => {
    if (!selectedDepartmentId) return;
    if (!window.confirm("Delete this report?")) return;
    try {
      await deleteDepartmentReport(selectedDepartmentId, reportId);
      toast.success("Report deleted.");
      await detailQuery.refetch();
      await refetch();
    } catch {
      toast.error("Failed to delete report.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">Department Management</h1>
        <p className="text-sm text-slate-300">
          Create, edit, and delete departments, then manage committee and reports for each one.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="form-input"
          placeholder="Search departments..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <button className="admin-btn-ghost" type="button" onClick={() => void refetch()}>
          Refresh
        </button>
      </div>

      {canCreate || canUpdate ? (
        <article className="rounded-md bg-white/[0.03] p-4">
          <h2 className="text-lg font-bold text-white">{editingId ? "Edit Department" : "Add Department"}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="form-input"
              placeholder="Department name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Image URL"
              value={form.imageUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
            />
            <textarea
              rows={2}
              className="form-input md:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="admin-btn-primary" type="button" onClick={() => void handleSubmit()}>
              {editingId ? "Save changes" : "Add department"}
            </button>
            {editingId ? (
              <button type="button" className="admin-btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </article>
      ) : null}

      {isLoading ? <p className="text-sm text-slate-300">Loading departments...</p> : null}
      {error ? <p className="text-sm text-rose-300">Failed to load departments.</p> : null}

      <div className="overflow-x-auto rounded-md bg-white/[0.03]">
        <table className="min-w-full text-sm text-slate-100">
          <thead>
            <tr className="bg-white/[0.05] text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-3 py-2 font-semibold">{row.name}</td>
                <td className="px-3 py-2">{row.description}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {canUpdate ? (
                      <button type="button" className="admin-btn-ghost px-2.5 py-1.5" onClick={() => handleEdit(row)}>
                        Edit
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className="admin-btn-danger px-2.5 py-1.5"
                        onClick={() => void handleDelete(row.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center text-slate-400" colSpan={3}>
                  No departments found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta ? (
        <div className="flex items-center justify-between text-sm text-slate-300">
          <p>
            Page {meta.page} / {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="admin-btn-ghost px-3 py-1.5"
              disabled={meta.page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="admin-btn-ghost px-3 py-1.5"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <article className="rounded-md bg-white/[0.03] p-4">
        <h2 className="text-lg font-bold text-white">Committee and Reports Inside Department</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <AppDropdown
            value={selectedDepartmentId}
            options={departmentOptions}
            onChange={setSelectedDepartmentId}
          />
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={() => void detailQuery.refetch()}
            disabled={!selectedDepartmentId}
          >
            Load details
          </button>
        </div>

        {selectedDepartmentId ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-md bg-[#08133c]/70 p-3">
              <h3 className="font-semibold text-white">Committee</h3>
              <div className="mt-2 grid gap-2">
                <input
                  className="form-input"
                  placeholder="Name"
                  value={committeeForm.name}
                  onChange={(e) => setCommitteeForm((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Role (Chairperson/Secretary/Member)"
                  value={committeeForm.title}
                  onChange={(e) => setCommitteeForm((p) => ({ ...p, title: e.target.value }))}
                />
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Description"
                  value={committeeForm.description}
                  onChange={(e) => setCommitteeForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <button className="admin-btn-primary" type="button" onClick={() => void submitCommittee()}>
                  {editingCommitteeId ? "Update member" : "Add member"}
                </button>
                {editingCommitteeId ? (
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    onClick={() => {
                      setEditingCommitteeId(null);
                      setCommitteeForm(initialCommitteeForm);
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid gap-2">
                {(detailQuery.data?.committee || []).map((member: any) => (
                  <div key={member.id} className="rounded-md bg-white/[0.05] p-2 text-sm">
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-church-300">{member.title}</p>
                    <p className="text-xs text-slate-300">{member.description}</p>
                    <div className="mt-1 flex gap-2">
                      {canUpdate ? (
                        <button
                          type="button"
                          className="admin-btn-ghost px-2 py-1 text-[11px]"
                          onClick={() => {
                            setEditingCommitteeId(member.id);
                            setCommitteeForm({
                              name: member.name ?? "",
                              title: member.title ?? "",
                              description: member.description ?? ""
                            });
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="admin-btn-danger px-2 py-1 text-[11px]"
                          onClick={() => void removeCommittee(member.id)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md bg-[#08133c]/70 p-3">
              <h3 className="font-semibold text-white">Reports</h3>
              <div className="mt-2 grid gap-2">
                <input
                  className="form-input"
                  placeholder="Title"
                  value={reportForm.title}
                  onChange={(e) => setReportForm((p) => ({ ...p, title: e.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Author"
                  value={reportForm.author}
                  onChange={(e) => setReportForm((p) => ({ ...p, author: e.target.value }))}
                />
                <input
                  className="form-input"
                  type="date"
                  value={reportForm.reportDate}
                  onChange={(e) => setReportForm((p) => ({ ...p, reportDate: e.target.value }))}
                />
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Content"
                  value={reportForm.content}
                  onChange={(e) => setReportForm((p) => ({ ...p, content: e.target.value }))}
                />
              </div>
              <button className="admin-btn-primary mt-2" type="button" onClick={() => void submitDepartmentReport()}>
                Add report
              </button>

              <div className="mt-3 grid gap-2">
                {(detailQuery.data?.reports || []).map((report: any) => (
                  <div key={report.id} className="rounded-md bg-white/[0.05] p-2 text-sm">
                    <p className="font-semibold text-white">{report.title}</p>
                    <p className="text-xs text-slate-300">{report.author}</p>
                    <p className="text-xs text-slate-300">{report.content}</p>
                    {canDelete ? (
                      <button
                        type="button"
                        className="admin-btn-danger mt-1 px-2 py-1 text-[11px]"
                        onClick={() => void removeDepartmentReport(report.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </article>
    </div>
  );
}
