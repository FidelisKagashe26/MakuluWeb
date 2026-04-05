import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import { fetchPublicMedia, type MediaItem } from "@/services/adminService";

function displayDate(input?: string) {
  if (!input) return "No date";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "No date";
  return format(parsed, "dd MMM yyyy");
}

export default function MemoriesSection() {
  const [photoItems, setPhotoItems] = useState<MediaItem[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [photosResponse, videosResponse] = await Promise.all([
          fetchPublicMedia({ category: "image", page: 1, limit: 4 }),
          fetchPublicMedia({ category: "video", page: 1, limit: 4 })
        ]);

        if (!cancelled) {
          setPhotoItems(photosResponse?.data ?? []);
          setVideoItems(videosResponse?.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setPhotoItems([]);
          setVideoItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const leftCards: Array<MediaItem | null> = useMemo(
    () => (loading ? Array(4).fill(null) : photoItems.slice(0, 4)),
    [loading, photoItems]
  );
  const rightVideos: Array<MediaItem | null> = useMemo(
    () => (loading ? Array(4).fill(null) : videoItems.slice(0, 4)),
    [loading, videoItems]
  );

  const hasAnyData = photoItems.length > 0 || videoItems.length > 0;

  return (
    <section className="border-y border-slate-300/70 bg-slate-100 py-10 sm:py-12 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#0a1438] dark:via-[#0c1a46] dark:to-[#0a1438]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45 }}
          className="text-center text-3xl uppercase tracking-[0.16em] text-slate-900 sm:text-4xl dark:text-white"
        >
          KUMBUKUMBU ZETU
        </motion.h2>

        {!loading && !hasAnyData ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300/75 bg-white/70 p-5 text-center text-sm text-slate-600 dark:border-white/20 dark:bg-white/[0.04] dark:text-slate-200">
            No data
          </div>
        ) : null}

        {loading || hasAnyData ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-300 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.08] dark:shadow-[0_18px_45px_rgba(6,12,36,0.35)] dark:backdrop-blur-md">
            <h3 className="text-2xl text-church-700 dark:text-church-100">Picha za Matukio</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-200/85">
              Picha rasmi zilizopakiwa kupitia admin panel.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {leftCards.map((item, index) => {
                if (!item) {
                  return (
                    <div
                      key={`photo-placeholder-${index}`}
                      className="h-52 animate-pulse rounded-xl border border-slate-200 bg-slate-200/80 dark:border-white/15 dark:bg-white/[0.08]"
                    />
                  );
                }

                return (
                  <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/15 dark:bg-slate-900/45">
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
                    <div className="space-y-1 p-2.5">
                      <p className="text-xs uppercase tracking-[0.12em] text-church-700 dark:text-church-200">Picha</p>
                      <h4 className="text-base text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{displayDate(item.createdAt)}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4">
              <Link
                to="/media?category=photos"
                className="inline-flex rounded-lg bg-church-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-church-800"
              >
                Tazama zaidi
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-300 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.08] dark:shadow-[0_18px_45px_rgba(6,12,36,0.35)] dark:backdrop-blur-md">
            <h3 className="text-2xl text-church-700 dark:text-church-100">Video za Mafundisho</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-200/85">
              Video rasmi zilizopakiwa kupitia admin panel.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {rightVideos.map((video, index) => {
                if (!video) {
                  return (
                    <div
                      key={`video-placeholder-${index}`}
                      className="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-200/80 dark:border-white/15 dark:bg-white/[0.08]"
                    />
                  );
                }

                const embedUrl = video.videoEmbedUrl || toYouTubeEmbedUrl(video.videoUrl || "");
                return (
                  <div key={video.id} className="space-y-2">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                      {embedUrl ? (
                        <iframe
                          className="aspect-video w-full"
                          src={embedUrl}
                          title={video.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          loading="lazy"
                          decoding="async"
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-slate-300">
                          No preview
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{video.title}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Link
                to="/media?category=videos"
                className="inline-flex rounded-lg bg-church-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-church-800"
              >
                Tazama zaidi
              </Link>
            </div>
          </article>
          </div>
        ) : null}
      </div>
    </section>
  );
}
