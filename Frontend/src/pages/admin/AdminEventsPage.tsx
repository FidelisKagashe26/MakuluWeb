import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useAuth } from "@/context/AuthContext";
import AppDropdown from "@/components/common/AppDropdown";
import AdminTableSkeleton from "@/components/common/AdminTableSkeleton";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  type EventItem,
  type EventStatus,
  updateEvent,
  uploadSiteImage
} from "@/services/adminService";

type EventForm = {
  title: string;
  summary: string;
  content: string;
  category: string;
  actionLabel: string;
  location: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  isPublished: boolean;
};

const initialForm: EventForm = {
  title: "",
  summary: "",
  content: "",
  category: "",
  actionLabel: "",
  location: "",
  imageUrl: "",
  startDate: "",
  endDate: "",
  isFeatured: false,
  isPublished: true
};

const statusOptions = [
  { value: "", label: "Status zote" },
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Yajayo" },
  { value: "ongoing", label: "Yanayoendelea" },
  { value: "past", label: "Yaliyopita" }
];

function toInputDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoDateTime(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const ts = new Date(trimmed).getTime();
  if (Number.isNaN(ts)) return "";
  return new Date(ts).toISOString();
}

function statusTone(status: EventStatus) {
  if (status === "ongoing") return "bg-emerald-100 text-emerald-700";
  if (status === "upcoming") return "bg-church-100 text-church-700";
  if (status === "past") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function statusLabel(status: EventStatus) {
  if (status === "ongoing") return "Yanayoendelea";
  if (status === "upcoming") return "Yajayo";
  if (status === "past") return "Yaliyopita";
  return "Draft";
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    const message = String(response?.data?.message || "").trim();
    if (message) return message;
  }

  return fallback;
}

export default function AdminEventsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("create");
  const canUpdate = hasPermission("update");
  const canDelete = hasPermission("delete");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(initialForm);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState("");

  const { data, isLoading, error, refetch } = useApiQuery(
    () =>
      fetchEvents({
        page: 1,
        limit: 200,
        search,
        status: statusFilter
      }),
    [search, statusFilter]
  );

  const rows = useMemo(() => data?.data ?? [], [data]);
  const previewImage = pendingImagePreview || form.imageUrl;

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setPendingImageFile(null);
    setPendingImagePreview("");
    setIsComposerOpen(false);
  };

  const onSelectImage = (file: File | null) => {
    if (pendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImageFile(file);
    setPendingImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async () => {
    if (!(canCreate || canUpdate)) return;
    if (isSubmitting || isUploadingImage) return;

    const title = form.title.trim();
    if (!title) {
      toast.error("Title ya tukio inahitajika.");
      return;
    }

    const startDate = toIsoDateTime(form.startDate);
    const endDate = toIsoDateTime(form.endDate);
    if (!startDate || !endDate) {
      toast.error("Weka tarehe sahihi za mwanzo na mwisho.");
      return;
    }

    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      toast.error("Start date haiwezi kuwa baada ya end date.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = form.imageUrl.trim();
      if (pendingImageFile) {
        setIsUploadingImage(true);
        imageUrl = await uploadSiteImage(pendingImageFile);
      }

      const payload = {
        title,
        summary: form.summary.trim(),
        content: form.content.trim(),
        category: form.category.trim(),
        actionLabel: form.actionLabel.trim(),
        location: form.location.trim(),
        imageUrl,
        startDate,
        endDate,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished
      };

      if (editingId) {
        await updateEvent(editingId, payload);
        toast.success("Tukio limehaririwa.");
      } else {
        await createEvent(payload);
        toast.success("Tukio limeongezwa.");
      }

      resetForm();
      await refetch();
    } catch (saveError) {
      toast.error(resolveErrorMessage(saveError, "Imeshindikana kuhifadhi tukio."));
    } finally {
      setIsUploadingImage(false);
      setIsSubmitting(false);
    }
  };

  const handleEdit = (row: EventItem) => {
    setEditingId(row.id);
    setPendingImageFile(null);
    setPendingImagePreview("");
    setForm({
      title: row.title || "",
      summary: row.summary || "",
      content: row.content || "",
      category: row.category || "",
      actionLabel: row.actionLabel || "",
      location: row.location || "",
      imageUrl: row.imageUrl || "",
      startDate: toInputDateTime(row.startDate),
      endDate: toInputDateTime(row.endDate),
      isFeatured: Boolean(row.isFeatured),
      isPublished: Boolean(row.isPublished)
    });
    setIsComposerOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!canDelete) return;
    if (!window.confirm("Unataka kufuta tukio hili?")) return;

    try {
      await deleteEvent(eventId);
      toast.success("Tukio limefutwa.");
      if (editingId === eventId) resetForm();
      await refetch();
    } catch {
      toast.error("Imeshindikana kufuta tukio.");
    }
  };

  const openCreateComposer = () => {
    setEditingId(null);
    setPendingImageFile(null);
    setPendingImagePreview("");
    setForm(initialForm);
    setIsComposerOpen(true);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">Matukio Management</h1>
        <p className="text-sm text-slate-300">
          Ongeza matukio ya vijana, michezo, utoaji damu, semina, na shughuli nyingine za kanisa.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_14rem]">
        <input
          className="form-input"
          placeholder="Tafuta matukio..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <AppDropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(value) => setStatusFilter(value as EventStatus | "")}
        />
      </div>

      {isLoading ? <AdminTableSkeleton rows={6} columns={6} /> : null}
      {error ? <p className="text-sm text-rose-300">Imeshindikana kupakia matukio.</p> : null}

      <div className="overflow-x-auto rounded-md bg-white/[0.03]">
        <table className="min-w-full text-sm text-slate-100">
          <thead>
            <tr className="bg-white/[0.05] text-left">
              <th className="px-3 py-2">S/N</th>
              <th className="px-3 py-2">Tukio</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ratiba</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row: EventItem, index: number) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-3 py-2 align-top text-xs font-semibold text-slate-300">{index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt={row.title}
                          className="h-12 w-12 rounded-lg object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-[10px] text-slate-300">
                          No image
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{row.title}</p>
                        <p className="truncate text-xs text-slate-300">
                          {[row.category || "General", row.summary || "-"].join(" | ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold uppercase ${statusTone(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                    {!row.isPublished ? <p className="mt-1 text-xs text-amber-300">Draft</p> : null}
                  </td>
                  <td className="px-3 py-2 text-xs leading-5 text-slate-300">
                    <p>Start: {formatDateTime(row.startDate)}</p>
                    <p>End: {formatDateTime(row.endDate)}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-300">{row.location || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {canUpdate ? (
                        <button className="admin-btn-ghost px-2.5 py-1.5" type="button" onClick={() => handleEdit(row)}>
                          Edit
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button className="admin-btn-danger px-2.5 py-1.5" type="button" onClick={() => void handleDelete(row.id)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-white/10">
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  Hakuna matukio yaliyopatikana.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canCreate || canUpdate ? (
        <article className="rounded-md bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              {editingId ? "Hariri Tukio" : "Ongeza Tukio"}
            </h2>
            <div className="flex gap-2">
              {!isComposerOpen ? (
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={openCreateComposer}
                  disabled={!canCreate}
                >
                  Ongeza Tukio
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-btn-ghost"
                  onClick={() => {
                    if (editingId) {
                      resetForm();
                    } else {
                      setIsComposerOpen(false);
                    }
                  }}
                >
                  Funga
                </button>
              )}
            </div>
          </div>

          {!isComposerOpen ? (
            <p className="mt-3 text-sm text-slate-300">
              List ya matukio ipo juu. Bonyeza <span className="font-semibold text-white">Ongeza Tukio</span> ili kufungua fomu ya kuongeza.
            </p>
          ) : (
            <>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input
                  className="form-input md:col-span-2"
                  placeholder="Jina la tukio"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
                <textarea
                  className="form-input md:col-span-2"
                  rows={2}
                  placeholder="Muhtasari mfupi"
                  value={form.summary}
                  onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                />
                <textarea
                  className="form-input md:col-span-2"
                  rows={4}
                  placeholder="Maelezo ya tukio"
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Category (mf. Youth Ministry)"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Button label (mf. Soma Tukio)"
                  value={form.actionLabel}
                  onChange={(event) => setForm((prev) => ({ ...prev, actionLabel: event.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Location (mf. Makulu Grounds)"
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Image URL (optional)"
                  value={form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                />
                <label className="grid gap-1 text-sm font-semibold">
                  Start DateTime
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  End DateTime
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  />
                </label>

                <div className="md:col-span-2 rounded-xl border border-white/15 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="admin-btn-ghost cursor-pointer px-3 py-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        disabled={isSubmitting || isUploadingImage}
                        onChange={(event) => onSelectImage(event.target.files?.[0] ?? null)}
                      />
                      {isUploadingImage ? "Uploading image..." : "Upload Image"}
                    </label>
                    {previewImage ? (
                      <button
                        type="button"
                        className="admin-btn-danger px-3 py-2"
                        onClick={() => {
                          onSelectImage(null);
                          setForm((prev) => ({ ...prev, imageUrl: "" }));
                        }}
                        disabled={isSubmitting || isUploadingImage}
                      >
                        Remove Image
                      </button>
                    ) : null}
                    <span className="text-xs text-slate-300">
                      {pendingImageFile ? pendingImageFile.name : previewImage ? "Image preview ready." : "No image selected."}
                    </span>
                  </div>

                  {previewImage ? (
                    <div className="mt-3 w-full max-w-[280px] overflow-hidden rounded-xl border border-white/10">
                      <img
                        src={previewImage}
                        alt="Event preview"
                        className="h-44 w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                </div>

                <label className="md:col-span-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
                  />
                  Weka kama tukio kuu (featured)
                </label>
                <label className="md:col-span-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                  />
                  Publish tukio hili (ikizimwa litakuwa Draft)
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="admin-btn-primary"
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || isUploadingImage}
                >
                  {isSubmitting || isUploadingImage
                    ? "Inahifadhi..."
                    : editingId
                      ? "Save changes"
                      : "Add event"}
                </button>
                <button className="admin-btn-ghost" type="button" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </article>
      ) : null}
    </div>
  );
}
