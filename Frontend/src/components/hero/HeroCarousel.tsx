import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Slide, { type CarouselSlideData } from "@/components/hero/Slide";
import { api } from "@/lib/api";

const AUTO_SLIDE_MS = 6000;
const IMAGE_PRELOAD_TIMEOUT_MS = 3500;

function mapCarouselSlides(input: unknown): CarouselSlideData[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, 4)
    .map((item: any, index): CarouselSlideData => ({
      id: String(item?.id || `slide-${index + 1}`),
      imageUrl: String(item?.imageUrl || ""),
      brightness: item?.brightness === "light" ? "light" : "dark",
      badge: String(item?.badge || ""),
      title: String(item?.title || ""),
      scripture: String(item?.scripture || ""),
      description: String(item?.description || ""),
      primaryCta: {
        label: String(item?.primaryLabel || item?.primaryCta?.label || "Learn More"),
        href: String(item?.primaryHref || item?.primaryCta?.href || "#")
      },
      secondaryCta: {
        label: String(item?.secondaryLabel || item?.secondaryCta?.label || "Contact Us"),
        href: String(item?.secondaryHref || item?.secondaryCta?.href || "#")
      }
    }))
    .filter((slide) => slide.imageUrl && slide.title);
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState<CarouselSlideData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesReady, setImagesReady] = useState(false);
  const sectionClass = "relative w-full pt-[var(--navbar-height,64px)]";
  const frameClass =
    "relative h-[calc(100svh-var(--navbar-height,64px))] min-h-[calc(100vh-var(--navbar-height,64px))] w-full overflow-hidden bg-black";

  const totalSlides = slides.length;
  const activeSlide = slides[activeIndex] ?? null;

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const response = await api.get<{ ok: boolean; data: Record<string, unknown> }>(
          "/public/site-settings",
          { params: { t: Date.now() } }
        );
        const mapped = mapCarouselSlides(response.data?.data?.heroCarousel);
        if (!cancelled) {
          setSlides(mapped);
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) {
          setSlides([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setImagesReady(false);

    if (slides.length === 0) {
      setImagesReady(true);
      return () => {
        cancelled = true;
      };
    }

    const preloaders = slides.map(
      (slide) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          let settled = false;
          const timeoutId = window.setTimeout(() => {
            if (!settled) {
              settled = true;
              resolve();
            }
          }, IMAGE_PRELOAD_TIMEOUT_MS);

          const done = () => {
            if (!settled) {
              settled = true;
              window.clearTimeout(timeoutId);
              resolve();
            }
          };

          image.onload = done;
          image.onerror = done;
          image.src = slide.imageUrl;
        })
    );

    Promise.allSettled(preloaders).then(() => {
      if (!cancelled) {
        setImagesReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slides]);

  useEffect(() => {
    if (!imagesReady || totalSlides <= 1) return;

    const timer = window.setInterval(() => {
      goToNext();
    }, AUTO_SLIDE_MS);

    return () => window.clearInterval(timer);
  }, [goToNext, imagesReady, totalSlides]);

  if (isLoading || !imagesReady) {
    return (
      <section className={sectionClass}>
        <div className={frameClass}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/90">DODOMA MAKULU SDA CHURCH</p>
              <p className="mt-3 text-base text-white/85">Loading hero images...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!activeSlide) {
    return (
      <section className={sectionClass}>
        <div className={frameClass}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/90">DODOMA MAKULU SDA CHURCH</p>
              <p className="mt-3 text-base text-white/85">No data</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div className={frameClass}>
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <Slide key={`${activeSlide.id}-${activeIndex}`} slide={activeSlide} direction={direction} />
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-0.5 overflow-hidden bg-white/30">
          {totalSlides > 1 ? (
            <motion.div
              key={`progress-${activeIndex}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: AUTO_SLIDE_MS / 1000, ease: "linear" }}
              className="h-full origin-left bg-white/95"
            />
          ) : (
            <div className="h-full bg-white/95" />
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs tracking-[0.14em] text-white">
          {activeIndex + 1} / {Math.max(totalSlides, 1)}
        </div>
      </div>
    </section>
  );
}
