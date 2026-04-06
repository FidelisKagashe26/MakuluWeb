import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import AppDropdown from "@/components/common/AppDropdown";
import {
  createMedia,
  createMediaCategory,
  deleteMedia,
  deleteMediaCategory,
  fetchAdminMedia,
  fetchAdminMediaCategories,
  type MediaCategory,
  type MediaCategoryItem,
  type MediaItem,
  updateMediaCategory,
  updateMedia,
  uploadSiteImage
} from "@/services/adminService";

type MediaForm = {
  title: string;
  description: string;
  mediaCategoryId: string;
  imageUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
};

type MediaTab = "photos" | "videos";

const initialForm: MediaForm = {
  title: "",
  description: "",
  mediaCategoryId: "",
  imageUrl: "",
  videoUrl: "",
  thumbnailUrl: ""
};

function normalizeMediaTab(input: string | null): MediaTab {
  return input === "videos" ? "videos" : "photos";
}

function resolveCategory(tab: MediaTab): MediaCategory {
  return tab === "videos" ? "video" : "image";
}

function resolveCategoryLabel(category: MediaCategory) {
  return category === "video" ? "Videos" : "Photos";
}

function resolveSingleLabel(category: MediaCategory) {
  return category === "video" ? "Video" : "Photo";
}

export default function AdminMediaPage() {
  const { isDark } = useTheme();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeMediaTab(searchParams.get("section"));
  const category = resolveCategory(activeTab);

  const [search, setSearch] = useState("");
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState("");
  const [form, setForm] = useState<MediaForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState("");
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [pendingThumbnailPreview, setPendingThumbnailPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);
  const canCreate = hasPermission("create");
  const canUpdate = hasPermission("update");
  const canDelete = hasPermission("delete");
  const canWrite = canCreate || canUpdate;

  const { data, isLoading, error, refetch } = useApiQuery(
    () =>
      fetchAdminMedia({
        category,
        mediaCategoryId: selectedFilterCategoryId || undefined,
        search: debouncedSearch,
        page: 1,
        limit: 80
      }),
    [category, selectedFilterCategoryId, debouncedSearch]
  );

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories
  } = useApiQuery(() => fetchAdminMediaCategories({ type: category }), [category]);

  const rows = useMemo(() => data?.data ?? [], [data]);
  const categories = useMemo<MediaCategoryItem[]>(() => categoriesData?.data ?? [], [categoriesData]);
  const categoryOptions = useMemo(
    () => categories.map((entry) => ({ value: entry.id, label: entry.name })),
    [categories]
  );
  const filterOptions = useMemo(
    () => [{ value: "", label: "All categories" }, ...categoryOptions],
    [categoryOptions]
  );
  const videoPreviewUrl = useMemo(
    () => toYouTubeEmbedUrl(form.videoUrl.trim()) || form.videoUrl.trim() || "",
    [form.videoUrl]
  );

  const tabClass = (tab: MediaTab) =>
    `admin-topbar-btn ${
      activeTab === tab
        ? isDark
          ? "border-church-300/60 bg-white/[0.15] text-white ring-1 ring-white/30"
          : "border-church-500/50 bg-church-50 text-church-800 ring-1 ring-church-200"
        : ""
    }`;

  const resetForm = (keepVisible = false) => {
    setForm((prev) => ({ ...initialForm, mediaCategoryId: prev.mediaCategoryId }));
    setEditingId(null);
    setPendingImageFile(null);
    setPendingThumbnailFile(null);

    if (pendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    if (pendingThumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingThumbnailPreview);
    }

    setPendingImagePreview("");
    setPendingThumbnailPreview("");

    if (!keepVisible) {
      setShowMediaForm(false);
    }
  };

  useEffect(() => {
    setSearch("");
    setSelectedFilterCategoryId("");
    setShowCategoryForm(false);
    setNewCategoryName("");
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setShowMediaForm(false);
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    return () => {
      if (pendingImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImagePreview);
      }
      if (pendingThumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(pendingThumbnailPreview);
      }
    };
  }, [pendingImagePreview, pendingThumbnailPreview]);

  useEffect(() => {
    if (!categories.length) {
      setForm((prev) => ({ ...prev, mediaCategoryId: "" }));
      return;
    }

    setForm((prev) => {
      if (prev.mediaCategoryId && categories.some((item) => item.id === prev.mediaCategoryId)) {
        return prev;
      }
      return { ...prev, mediaCategoryId: categories[0].id };
    });
  }, [categories]);

  const onSelectImage = (file: File | null) => {
    setPendingImageFile(file);
    if (pendingImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const onSelectThumbnail = (file: File | null) => {
    setPendingThumbnailFile(file);
    if (pendingThumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingThumbnailPreview);
    }
    setPendingThumbnailPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleOpenAddMedia = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      mediaCategoryId: categories[0]?.id || ""
    });
    setShowMediaForm(true);
  };

  const handleSubmit = async () => {
    if (!canWrite) return;

    if (!form.mediaCategoryId) {
      toast.error("Please create/select a category first.");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    if (!title) {
      toast.error("Title is required.");
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = form.imageUrl.trim();
      let videoUrl = form.videoUrl.trim();
      let thumbnailUrl = form.thumbnailUrl.trim();

      if (category === "image") {
        if (pendingImageFile) {
          imageUrl = await uploadSiteImage(pendingImageFile);
        }
        if (!imageUrl) {
          toast.error("Please upload a photo first.");
          return;
        }
      }

      if (category === "video") {
        if (pendingThumbnailFile) {
          thumbnailUrl = await uploadSiteImage(pendingThumbnailFile);
        }
        if (!videoUrl) {
          toast.error("Video URL is required.");
          return;
        }
      }

      const payload = {
        category,
        mediaCategoryId: form.mediaCategoryId,
        title,
        description,
        imageUrl: category === "image" ? imageUrl : "",
        videoUrl: category === "video" ? videoUrl : "",
        thumbnailUrl: category === "video" ? thumbnailUrl : ""
      };

      if (editingId) {
        if (!canUpdate) return;
        await updateMedia(editingId, payload);
        toast.success("Media updated.");
      } else {
        if (!canCreate) return;
        await createMedia(payload);
        toast.success("Media created.");
      }

      resetForm();
      await refetch();
    } catch {
      toast.error("Failed to save media.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!canCreate) return;
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name is required.");
      return;
    }

    try {
      const created = await createMediaCategory({ type: category, name });
      toast.success("Category added.");
      setNewCategoryName("");
      setShowCategoryForm(false);
      await refetchCategories();
      setSelectedFilterCategoryId(created.id);
      setForm((prev) => ({ ...prev, mediaCategoryId: created.id }));
    } catch {
      toast.error("Failed to add category.");
    }
  };

  const handleStartEditCategory = (entry: MediaCategoryItem) => {
    if (!canUpdate) return;
    setEditingCategoryId(entry.id);
    setEditingCategoryName(entry.name);
    setShowCategoryForm(false);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleUpdateCategory = async () => {
    if (!canUpdate || !editingCategoryId) return;
    const name = editingCategoryName.trim();
    if (!name) {
      toast.error("Category name is required.");
      return;
    }

    try {
      await updateMediaCategory(editingCategoryId, { name });
      toast.success("Category updated.");
      handleCancelCategoryEdit();
      await refetchCategories();
    } catch {
      toast.error("Failed to update category.");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!canDelete) return;
    if (!window.confirm("Delete this category?")) return;

    try {
      await deleteMediaCategory(categoryId);
      toast.success("Category deleted.");
      if (selectedFilterCategoryId === categoryId) {
        setSelectedFilterCategoryId("");
      }
      if (form.mediaCategoryId === categoryId) {
        setForm((prev) => ({ ...prev, mediaCategoryId: "" }));
      }
      if (editingCategoryId === categoryId) {
        handleCancelCategoryEdit();
      }
      await refetchCategories();
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  const handleEdit = (row: MediaItem) => {
    setEditingId(row.id);
    setForm({
      title: row.title || "",
      description: row.description || "",
      mediaCategoryId: row.mediaCategoryId || categories[0]?.id || "",
      imageUrl: row.imageUrl || "",
      videoUrl: row.videoUrl || "",
      thumbnailUrl: row.thumbnailUrl || ""
    });
    onSelectImage(null);
    onSelectThumbnail(null);
    setShowMediaForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (!window.confirm("Delete this media item?")) return;

    try {
      await deleteMedia(id);
      toast.success("Media deleted.");
      if (editingId === id) {
        resetForm();
      }
      await refetch();
    } catch {
      toast.error("Failed to delete media.");
    }
  };

  const setActiveTab = (tab: MediaTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("section", tab);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-5">
      <header className="rounded-md bg-white/[0.03] p-4">
        <h1 className="text-2xl font-bold text-white">Media Library</h1>
        <p className="text-sm text-slate-300">
          Manage homepage media content. Photos and videos here will appear on the public website.
        </p>
      </header>

      <nav className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/[0.02] p-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={tabClass("photos")} onClick={() => setActiveTab("photos")}>
            Photos
          </button>
          <button type="button" className={tabClass("videos")} onClick={() => setActiveTab("videos")}>
            Videos
          </button>
        </div>
      </nav>

      <section className="space-y-3 rounded-md bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <button className="admin-btn-primary" type="button" onClick={handleOpenAddMedia}>
                + Add {resolveSingleLabel(category)}
              </button>
            ) : null}
            {canCreate ? (
              <button
                className="admin-btn-ghost"
                type="button"
                onClick={() => {
                  handleCancelCategoryEdit();
                  setShowCategoryForm((prev) => !prev);
                }}
              >
                + Add Category
              </button>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
              className="form-input sm:w-72"
              placeholder={`Search ${resolveCategoryLabel(category).toLowerCase()}...`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <AppDropdown
              className="sm:w-56"
              value={selectedFilterCategoryId}
              options={filterOptions}
              onChange={setSelectedFilterCategoryId}
            />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-2 rounded-md border border-white/15 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{resolveCategoryLabel(category)} categories</p>
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-slate-300">
                {categories.length}
              </span>
            </div>

            {isCategoriesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`category-skeleton-${index}`}
                    className="h-10 animate-pulse rounded-md bg-white/[0.07]"
                  />
                ))}
              </div>
            ) : null}
            {!isCategoriesLoading && categories.length === 0 ? (
              <p className="text-sm text-slate-300">No categories yet. Add one first.</p>
            ) : null}

            {categories.map((entry) => {
              const isEditingCategory = editingCategoryId === entry.id;
              const isCurrentFilter = selectedFilterCategoryId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2"
                >
                  {isEditingCategory ? (
                    <input
                      className="form-input min-w-[12rem] flex-1"
                      value={editingCategoryName}
                      onChange={(event) => setEditingCategoryName(event.target.value)}
                      placeholder="Category name"
                    />
                  ) : (
                    <button
                      type="button"
                      className={`rounded-md px-2 py-1 text-left text-sm transition ${
                        isCurrentFilter
                          ? "bg-church-700 text-white"
                          : "text-slate-200 hover:bg-white/[0.08] hover:text-white"
                      }`}
                      onClick={() =>
                        setSelectedFilterCategoryId((prev) => (prev === entry.id ? "" : entry.id))
                      }
                    >
                      {entry.name}
                    </button>
                  )}

                  <div className="ml-auto flex items-center gap-1.5">
                    {isEditingCategory ? (
                      <>
                        <button
                          type="button"
                          className="admin-btn-primary px-2.5 py-1.5"
                          onClick={() => void handleUpdateCategory()}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost px-2.5 py-1.5"
                          onClick={handleCancelCategoryEdit}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {canUpdate ? (
                          <button
                            type="button"
                            className="admin-btn-ghost px-2.5 py-1.5"
                            onClick={() => handleStartEditCategory(entry)}
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className="admin-btn-danger px-2.5 py-1.5"
                            onClick={() => void handleDeleteCategory(entry.id)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canCreate ? (
            <div className="space-y-2 rounded-md border border-white/15 bg-white/[0.02] p-3">
              <p className="text-sm font-semibold text-white">Add new category</p>
              {showCategoryForm ? (
                <div className="space-y-2">
                  <input
                    className="form-input"
                    placeholder={`New ${resolveSingleLabel(category)} category`}
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button className="admin-btn-primary px-3 py-1.5" type="button" onClick={() => void handleCreateCategory()}>
                      Save Category
                    </button>
                    <button className="admin-btn-ghost px-3 py-1.5" type="button" onClick={() => setShowCategoryForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-300">Click "+ Add Category" to create a new category.</p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {showMediaForm ? (
        <article className="rounded-md bg-white/[0.03] p-4">
          <h2 className="text-lg font-bold text-white">
            {editingId ? `Edit ${resolveSingleLabel(category)}` : `Add ${resolveSingleLabel(category)}`}
          </h2>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              <span>Title</span>
              <input
                className="form-input"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Media title"
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              <span>Category</span>
              <AppDropdown
                value={form.mediaCategoryId}
                options={categoryOptions}
                onChange={(value) => setForm((prev) => ({ ...prev, mediaCategoryId: value }))}
                placeholder="Select category"
                emptyLabel="No categories yet"
              />
            </label>

            {category === "video" ? (
              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                <span>Video URL</span>
                <input
                  className="form-input"
                  value={form.videoUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>
            ) : null}

            <label className="grid gap-1 text-sm font-semibold md:col-span-2">
              <span>Description</span>
              <textarea
                className="form-input"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Short description"
              />
            </label>

            {category === "image" ? (
              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                <span>Photo Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(event) => onSelectImage(event.target.files?.[0] || null)}
                />
              </label>
            ) : (
              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                <span>Thumbnail Upload (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(event) => onSelectThumbnail(event.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          {category === "image" ? (
            <div className="mt-3 rounded-md border border-white/15 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Photo preview</p>
              {pendingImagePreview || form.imageUrl ? (
                <img
                  src={pendingImagePreview || form.imageUrl}
                  alt={form.title || "Media preview"}
                  className="mt-2 h-48 w-full rounded-md object-cover"
                />
              ) : (
                <p className="mt-2 text-sm text-slate-400">No photo selected yet.</p>
              )}
            </div>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-white/15 bg-white/[0.02] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Video preview</p>
                {videoPreviewUrl ? (
                  <div className="mt-2 overflow-hidden rounded-md bg-black">
                    <iframe
                      className="aspect-video w-full"
                      src={videoPreviewUrl}
                      title="Video preview"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">Paste a YouTube URL to preview.</p>
                )}
              </div>

              <div className="rounded-md border border-white/15 bg-white/[0.02] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Thumbnail preview</p>
                {pendingThumbnailPreview || form.thumbnailUrl ? (
                  <img
                    src={pendingThumbnailPreview || form.thumbnailUrl}
                    alt={form.title || "Thumbnail preview"}
                    className="mt-2 h-40 w-full rounded-md object-cover"
                  />
                ) : (
                  <p className="mt-2 text-sm text-slate-400">No thumbnail selected.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="admin-btn-primary"
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : editingId ? "Save changes" : `Add ${resolveSingleLabel(category)}`}
            </button>
            <button className="admin-btn-ghost" type="button" onClick={() => resetForm()}>
              Cancel
            </button>
          </div>
        </article>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`media-card-skeleton-${index}`}
              className="h-64 animate-pulse rounded-md border border-white/15 bg-white/[0.04]"
            />
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-300">Failed to load media.</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const embedUrl = row.videoEmbedUrl || toYouTubeEmbedUrl(row.videoUrl || "");
          const previewImage = row.category === "image" ? row.imageUrl : row.thumbnailUrl;

          return (
            <article key={row.id} className="overflow-hidden rounded-md border border-white/15 bg-white/[0.04]">
              {row.category === "image" ? (
                previewImage ? (
                  <img
                    src={previewImage}
                    alt={row.title}
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-white/[0.03] text-sm text-slate-400">
                    No image
                  </div>
                )
              ) : embedUrl ? (
                <iframe
                  className="aspect-video w-full"
                  src={embedUrl}
                  title={row.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : previewImage ? (
                <img
                  src={previewImage}
                  alt={row.title}
                  loading="lazy"
                  decoding="async"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-white/[0.03] text-sm text-slate-400">
                  No preview
                </div>
              )}

              <div className="space-y-2 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-church-300">
                  {resolveCategoryLabel(row.category)}{row.mediaCategoryName ? ` | ${row.mediaCategoryName}` : ""}
                </p>
                <h3 className="text-base font-bold text-white">{row.title}</h3>
                {row.description ? <p className="text-sm text-slate-300">{row.description}</p> : null}
                <div className="flex gap-2">
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
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
