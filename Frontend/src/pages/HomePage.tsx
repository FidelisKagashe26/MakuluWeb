import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import SectionSkeleton from "@/components/common/SectionSkeleton";
import HeroCarousel from "@/components/hero/HeroCarousel";

const MissionSection = lazy(() => import("@/components/home/MissionSection"));
const RecentHighlightsSection = lazy(() => import("@/components/home/RecentHighlightsSection"));
const MemoriesSection = lazy(() => import("@/components/home/MemoriesSection"));

const websiteUrl = import.meta.env.VITE_SITE_URL || "https://dodomamakulusda.org";
const siteName = "DODOMA MAKULU SDA CHURCH";
const siteDescription = "Tovuti rasmi ya DODOMA MAKULU SDA CHURCH kwa taarifa na huduma za kiroho.";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>DODOMA MAKULU SDA CHURCH | Adventist Website</title>
        <meta name="description" content={siteDescription} />
        <meta
          name="keywords"
          content="Dodoma Makulu SDA, Adventist Tanzania, Kanisa Dodoma, Matangazo ya Kanisa"
        />
        <meta property="og:title" content="DODOMA MAKULU SDA CHURCH" />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={websiteUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={websiteUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Church",
            name: siteName,
            url: websiteUrl,
            description: siteDescription
          })}
        </script>
      </Helmet>

      <div className="w-full">
        <HeroCarousel />
        <Suspense fallback={<SectionSkeleton />}>
          <MissionSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <RecentHighlightsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <MemoriesSection />
        </Suspense>
      </div>
    </>
  );
}
