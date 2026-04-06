import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { createGroup, deleteGroup, fetchGroups, updateGroup } from "@/services/adminService";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import { useAuth } from "@/context/AuthContext";
import AdminTableSkeleton from "@/components/common/AdminTableSkeleton";

type GroupForm = {
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  youtubeLink: string;
};

const initialForm: GroupForm = {
  name: "",
  type: "Group",
  description: "",
  imageUrl: "",
  youtubeLink: ""
};

export default function AdminGroupsPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<GroupForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetchGroups({ search: debouncedSearch, page: 1, limit: 30 }),
    [debouncedSearch]
  );

  const rows = useMemo(() => data?.data ?? [], [data]);
  const previewEmbed = toYouTubeEmbedUrl(form.youtubeLink);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateGroup(editingId, form);
        toast.success("Group updated.");
      } else {
        await createGroup(form);
        toast.success("Group created.");
      }
      setForm(initialForm);
      setEditingId(null);
      await refetch();
    } catch {
      toast.error("Failed to save group.");
    }
  };

  const editRow = (row: any) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      type: row.type ?? "Group",
      description: row.description ?? "",
      imageUrl: row.imageUrl ?? "",
      youtubeLink: row.youtubeLink ?? ""
    });
  };

  const removeRow = async (id: string) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      await deleteGroup(id);
      toast.success("Group deleted.");
      await refetch();
    } catch {
      toast.error("Failed to delete group.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">Choirs and Groups Management</h1>
        <p className="text-sm text-slate-300">Add groups, manage YouTube links, and preview embedded videos.</p>
      </header>

      <input
        className="form-input"
        placeholder="Search groups..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {hasPermission("create") || hasPermission("update") ? (
        <article className="rounded-md bg-white/[0.03] p-4">
          <h2 className="text-lg font-bold text-white">{editingId ? "Edit Group" : "Add Group"}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="form-input" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="Type" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} />
            <input className="form-input" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            <input className="form-input" placeholder="YouTube Link" value={form.youtubeLink} onChange={(e) => setForm((p) => ({ ...p, youtubeLink: e.target.value }))} />
            <textarea className="form-input md:col-span-2" rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          {previewEmbed ? (
            <div className="mt-3 overflow-hidden rounded-md bg-white/[0.04]">
              <iframe
                className="aspect-video w-full"
                src={previewEmbed}
                title="YouTube preview"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : null}

          <div className="mt-3 flex gap-2">
            <button className="admin-btn-primary" type="button" onClick={() => void handleSubmit()}>
              {editingId ? "Save changes" : "Add group"}
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
      {error ? <p className="text-sm text-rose-300">Failed to load groups.</p> : null}

      <div className="overflow-x-auto rounded-md bg-white/[0.03]">
        <table className="min-w-full text-sm text-slate-100">
          <thead>
            <tr className="bg-white/[0.05] text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">YouTube</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.type}</td>
                <td className="px-3 py-2">
                  <a href={row.youtubeLink} target="_blank" rel="noreferrer" className="text-church-300">
                    Open link
                  </a>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {hasPermission("update") ? (
                      <button className="admin-btn-ghost px-2.5 py-1.5" type="button" onClick={() => editRow(row)}>
                        Edit
                      </button>
                    ) : null}
                    {hasPermission("delete") ? (
                      <button className="admin-btn-danger px-2.5 py-1.5" type="button" onClick={() => void removeRow(row.id)}>
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
