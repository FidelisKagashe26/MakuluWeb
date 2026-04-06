import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApiQuery";
import { createLeader, deleteLeader, fetchLeaders, updateLeader } from "@/services/adminService";
import { useAuth } from "@/context/AuthContext";
import AppDropdown from "@/components/common/AppDropdown";
import AdminTableSkeleton from "@/components/common/AdminTableSkeleton";

type LeaderForm = {
  name: string;
  title: string;
  biography: string;
  imageUrl: string;
  order: number;
};

const initialForm: LeaderForm = {
  name: "",
  title: "",
  biography: "",
  imageUrl: "",
  order: 1
};

const sortOptions = [
  { value: "order", label: "Sort by Order" },
  { value: "title", label: "Sort by Title" }
];

export default function AdminLeadersPage() {
  const { hasPermission } = useAuth();
  const [form, setForm] = useState<LeaderForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sort, setSort] = useState("order");

  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetchLeaders({ sort, page: 1, limit: 30 }),
    [sort]
  );

  const rows = useMemo(() => data?.data ?? [], [data]);

  const submit = async () => {
    try {
      if (editingId) {
        await updateLeader(editingId, form);
        toast.success("Leader updated.");
      } else {
        await createLeader(form);
        toast.success("Leader created.");
      }
      setForm(initialForm);
      setEditingId(null);
      await refetch();
    } catch {
      toast.error("Failed to save leader.");
    }
  };

  const editRow = (row: any) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      title: row.title ?? "",
      biography: row.biography ?? "",
      imageUrl: row.imageUrl ?? "",
      order: Number(row.order || 1)
    });
  };

  const deleteRow = async (id: string) => {
    if (!window.confirm("Delete this leader?")) return;
    try {
      await deleteLeader(id);
      toast.success("Leader deleted.");
      await refetch();
    } catch {
      toast.error("Failed to delete leader.");
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaders Management</h1>
          <p className="text-sm text-slate-300">Create leaders, set display order, and update profiles.</p>
        </div>
        <AppDropdown className="w-44" value={sort} options={sortOptions} onChange={setSort} />
      </header>

      {hasPermission("create") || hasPermission("update") ? (
        <article className="rounded-md bg-white/[0.03] p-4">
          <h2 className="text-lg font-bold text-white">{editingId ? "Edit Leader" : "Add Leader"}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="form-input" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            <input className="form-input" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            <input className="form-input" placeholder="Order" type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) || 1 }))} />
            <textarea className="form-input md:col-span-2" rows={2} placeholder="Biography" value={form.biography} onChange={(e) => setForm((p) => ({ ...p, biography: e.target.value }))} />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="admin-btn-primary" type="button" onClick={() => void submit()}>
              {editingId ? "Save changes" : "Add leader"}
            </button>
            {editingId ? (
              <button className="admin-btn-ghost" type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                Cancel
              </button>
            ) : null}
          </div>
        </article>
      ) : null}

      {isLoading ? <AdminTableSkeleton rows={6} columns={4} /> : null}
      {error ? <p className="text-sm text-rose-300">Failed to load leaders.</p> : null}

      <div className="overflow-x-auto rounded-md bg-white/[0.03]">
        <table className="min-w-full text-sm text-slate-100">
          <thead>
            <tr className="bg-white/[0.05] text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{row.order}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {hasPermission("update") ? (
                      <button className="admin-btn-ghost px-2.5 py-1.5" type="button" onClick={() => editRow(row)}>
                        Edit
                      </button>
                    ) : null}
                    {hasPermission("delete") ? (
                      <button className="admin-btn-danger px-2.5 py-1.5" type="button" onClick={() => void deleteRow(row.id)}>
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
