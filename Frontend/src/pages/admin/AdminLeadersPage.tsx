import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApiQuery";
import {
  createLeader,
  deleteLeader,
  fetchLeaders,
  type LeaderItem,
  updateLeader,
  uploadSiteImage
} from "@/services/adminService";
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

function resolveErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    (error as any).response?.data?.message
  ) {
    return String((error as any).response.data.message);
  }

  if (error && typeof error === "object" && "message" in error && (error as any).message) {
    return String((error as any).message);
  }

  return fallback;
}

export default function AdminLeadersPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("create");
  const canUpdate = hasPermission("update");
  const canDelete = hasPermission("delete");
  const canUploadImage = canUpdate;
  const [form, setForm] = useState<LeaderForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sort, setSort] = useState("order");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetchLeaders({ sort, page: 1, limit: 30 }),
    [sort]
  );

  const rows = useMemo<LeaderItem[]>(() => data?.data ?? [], [data]);

  useEffect(() => {
    return () => {
      if (pendingImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImagePreview);
      }
    };
  }, [pendingImagePreview]);

  const clearPendingImage = () => {
    if (pendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImageFile(null);
    setPendingImagePreview("");
    setUploadProgress(0);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    clearPendingImage();
  };

  const onSelectImage = (file: File | null) => {
    if (pendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImageFile(file);
    setPendingImagePreview(file ? URL.createObjectURL(file) : "");
    setUploadProgress(0);
  };

  const submit = async () => {
    if (isSubmitting || isUploadingImage) return;

    const name = form.name.trim();
    const title = form.title.trim();
    const biography = form.biography.trim();
    const order = Number(form.order) || 1;

    if (!name || !title) {
      toast.error("Name and title are required.");
      return;
    }

    if (pendingImageFile && !canUploadImage) {
      toast.error("You need update permission to upload leader photos.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = form.imageUrl.trim();

      if (pendingImageFile) {
        setIsUploadingImage(true);
        setUploadProgress(1);
        imageUrl = await uploadSiteImage(pendingImageFile, (percent) => {
          setUploadProgress((prev) => Math.max(prev, percent));
        });
        setUploadProgress(100);
      }

      const payload = {
        name,
        title,
        biography,
        imageUrl,
        order
      };

      if (editingId) {
        await updateLeader(editingId, payload);
        toast.success("Leader updated.");
      } else {
        await createLeader(payload);
        toast.success("Leader created.");
      }

      resetForm();
      await refetch();
    } catch (saveError) {
      toast.error(resolveErrorMessage(saveError, "Failed to save leader."));
    } finally {
      setIsUploadingImage(false);
      setIsSubmitting(false);
    }
  };

  const editRow = (row: LeaderItem) => {
    clearPendingImage();
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

  const formImagePreview = pendingImagePreview || form.imageUrl;
  const saveButtonLabel = editingId ? "Save changes" : "Add leader";
  const saveButtonBusyLabel = editingId ? "Saving..." : "Adding...";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaders Management</h1>
          <p className="text-sm text-slate-300">Create leaders, set display order, and update profiles.</p>
        </div>
        <AppDropdown className="w-44" value={sort} options={sortOptions} onChange={setSort} />
      </header>

      {canCreate || canUpdate ? (
        <article className="rounded-md bg-white/[0.03] p-4">
          <h2 className="text-lg font-bold text-white">{editingId ? "Edit Leader" : "Add Leader"}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="form-input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Order"
              type="number"
              value={form.order}
              onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) || 1 }))}
            />
            <textarea
              className="form-input md:col-span-2"
              rows={2}
              placeholder="Biography"
              value={form.biography}
              onChange={(e) => setForm((p) => ({ ...p, biography: e.target.value }))}
            />

            <div className="md:col-span-2 rounded-xl border border-white/15 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className={`admin-btn-ghost cursor-pointer px-3 py-2 ${!canUploadImage ? "opacity-60" : ""}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={!canUploadImage || isSubmitting || isUploadingImage}
                    onChange={(event) => onSelectImage(event.target.files?.[0] ?? null)}
                  />
                  {isUploadingImage ? "Uploading photo..." : "Upload Photo"}
                </label>
                {formImagePreview ? (
                  <button
                    type="button"
                    className="admin-btn-danger px-3 py-2"
                    onClick={() => {
                      clearPendingImage();
                      setForm((p) => ({ ...p, imageUrl: "" }));
                    }}
                    disabled={isSubmitting || isUploadingImage}
                  >
                    Remove Photo
                  </button>
                ) : null}
                <span className="text-xs text-slate-300">
                  {isUploadingImage
                    ? `Uploading ${uploadProgress}%`
                    : pendingImageFile
                      ? pendingImageFile.name
                      : form.imageUrl
                        ? "Current photo loaded."
                        : "No photo selected yet."}
                </span>
              </div>

              {!canUploadImage ? (
                <p className="mt-2 text-xs text-amber-300">
                  Photo upload requires update permission for Leaders section.
                </p>
              ) : null}

              {formImagePreview ? (
                <div className="mt-3 w-full max-w-[220px] overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={formImagePreview}
                    alt="Leader preview"
                    className="h-44 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="mt-3 flex h-44 w-full max-w-[220px] items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-slate-400">
                  No image
                </div>
              )}

              <input
                className="form-input mt-3"
                placeholder="or paste Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="admin-btn-primary"
              type="button"
              onClick={() => void submit()}
              disabled={isSubmitting || isUploadingImage}
            >
              {isSubmitting || isUploadingImage ? saveButtonBusyLabel : saveButtonLabel}
            </button>
            {editingId ? (
              <button
                className="admin-btn-ghost"
                type="button"
                onClick={resetForm}
                disabled={isSubmitting || isUploadingImage}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </article>
      ) : null}

      {isLoading ? <AdminTableSkeleton rows={6} columns={5} /> : null}
      {error ? <p className="text-sm text-rose-300">Failed to load leaders.</p> : null}

      <div className="overflow-x-auto rounded-md bg-white/[0.03]">
        <table className="min-w-full text-sm text-slate-100">
          <thead>
            <tr className="bg-white/[0.05] text-left">
              <th className="px-3 py-2">Photo</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: LeaderItem) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-3 py-2">
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt={row.name}
                      className="h-12 w-12 rounded-lg object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No image</span>
                  )}
                </td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{row.order}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {canUpdate ? (
                      <button className="admin-btn-ghost px-2.5 py-1.5" type="button" onClick={() => editRow(row)}>
                        Edit
                      </button>
                    ) : null}
                    {canDelete ? (
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
