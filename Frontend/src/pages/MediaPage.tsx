import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import AppDropdown from "@/components/common/AppDropdown";
import {
  fetchPublicMedia,
  fetchPublicMediaCategories,
  type MediaCategoryItem,
  type MediaItem
} from "@/services/adminService";

type TabKey = "photos" | "videos";

function getActiveTab(input: string | null): TabKey {
  return input === "videos" ? "videos" : "photos";
}

function formatDate(dateInput?: string) {
  if (!dateInput) return "No date";
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "No date";
  return format(parsed, "dd MMM yyyy");
}

function resolveItemsPerPage(width: number) {
  if (width >= 1024) return 12; // desktop: 4 columns x 3 rows
  if (width >= 768) return 9; // ipad: 3 columns x 3 rows
  return 4; // mobile: 1 column, 4 items per page
}

export default function MediaPage() {
  const [searchParams] = useSearchParams();
  const activeTab = getActiveTab(searchParams.get("category"));
  const activeType = activeTab === "videos" ? "video" : "image";

  const [photoItems, setPhotoItems] = useState<MediaItem[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItem[]>([]);
  const [photoCategories, setPhotoCategories] = useState<MediaCategoryItem[]>([]);
  const [videoCategories, setVideoCategories] = useState<MediaCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window === "undefined") return 12;
    return resolveItemsPerPage(window.innerWidth);
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [photosResponse, videosResponse, photoCategoriesResponse, videoCategoriesResponse] = await Promise.all([
          fetchPublicMedia({ category: "image", page: 1, limit: 80 }),
          fetchPublicMedia({ category: "video", page: 1, limit: 80 }),
          fetchPublicMediaCategories({ type: "image" }),
          fetchPublicMediaCategories({ type: "video" })
        ]);

        if (!cancelled) {
          setPhotoItems(photosResponse?.data ?? []);
          setVideoItems(videosResponse?.data ?? []);
          setPhotoCategories(photoCategoriesResponse?.data ?? []);
          setVideoCategories(videoCategoriesResponse?.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setPhotoItems([]);
          setVideoItems([]);
          setPhotoCategories([]);
          setVideoCategories([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeItems = useMemo(
    () => (activeTab === "photos" ? photoItems : videoItems),
    [activeTab, photoItems, videoItems]
  );
  const activeCategories = useMemo(
    () => (activeType === "image" ? photoCategories : videoCategories),
    [activeType, photoCategories, videoCategories]
  );
  const categoryFilterOptions = useMemo(
    () => [{ value: "", label: "All categories" }, ...activeCategories.map((entry) => ({ value: entry.id, label: entry.name }))],
    [activeCategories]
  );
  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return activeItems.filter((item) => {
      if (selectedCategoryId && item.mediaCategoryId !== selectedCategoryId) return false;
      if (!query) return true;

      return (
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.description || "").toLowerCase().includes(query) ||
        String(item.mediaCategoryName || "").toLowerCase().includes(query)
      );
    });
  }, [activeItems, searchValue, selectedCategoryId]);
  const totalPages = Math.max(Math.ceil(filteredItems.length / itemsPerPage), 1);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedCategoryId("");
    setSearchValue("");
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const onResize = () => {
      setItemsPerPage(resolveItemsPerPage(window.innerWidth));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <Helmet>
        <title>Media | DODOMA MAKULU SDA CHURCH</title>
        <meta
          name="description"
          content="Picha na video rasmi za huduma na matukio ya DODOMA MAKULU SDA CHURCH."
        />
      </Helmet>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-3 sm:px-6">
        <div className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-church-600 dark:text-church-300">
              CHURCH MEDIA
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/media?category=photos"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "photos"
                    ? "bg-church-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Picha
              </Link>
              <Link
                to="/media?category=videos"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "videos"
                    ? "bg-church-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Video
              </Link>
            </div>
          </div>
          <div className="mt-3 h-px w-full bg-slate-300/80 dark:bg-white/15" />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="form-input sm:w-80"
              placeholder="Search..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <AppDropdown
              className="sm:w-56"
              value={selectedCategoryId}
              options={categoryFilterOptions}
              onChange={setSelectedCategoryId}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: Math.min(itemsPerPage, 12) }).map((_, index) => (
              <div
                key={`media-loading-${index}`}
                className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredItems.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-100/75 p-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-300">
            Hakuna {activeTab === "photos" ? "picha" : "video"} zilizowekwa bado.
          </div>
        ) : null}

        {!isLoading && filteredItems.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {activeTab === "photos"
              ? paginatedItems.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-slate-900/55"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        No image
                      </div>
                    )}
                    <div className="space-y-1 p-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                      {item.description ? <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p> : null}
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </article>
                ))
              : paginatedItems.map((item) => {
                  const embedUrl = item.videoEmbedUrl || toYouTubeEmbedUrl(item.videoUrl || "");
                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-slate-900/55"
                    >
                      {embedUrl ? (
                        <iframe
                          className="aspect-video w-full"
                          src={embedUrl}
                          title={item.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          No preview
                        </div>
                      )}
                      <div className="space-y-1 p-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                        {item.description ? <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p> : null}
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </article>
                  );
                })}
          </div>
        ) : null}

        {!isLoading && filteredItems.length > 0 && totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const isActive = page === currentPage;
              return (
                <button
                  key={`media-page-${page}`}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-church-700 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
