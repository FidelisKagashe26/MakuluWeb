import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type QuickLink = {
  id: string;
  label: string;
  href: string;
};

type SocialKey = "facebook" | "youtube" | "instagram" | "whatsapp";

type FooterSettings = {
  churchName: string;
  description: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  socialLinks: Record<SocialKey, string>;
  quickLinks: QuickLink[];
  footerText: string;
};

const emptyQuickLinks: QuickLink[] = [];

const emptySettings: FooterSettings = {
  churchName: "",
  description: "",
  contactInfo: {
    phone: "",
    email: "",
    address: ""
  },
  socialLinks: {
    facebook: "",
    youtube: "",
    instagram: "",
    whatsapp: ""
  },
  quickLinks: emptyQuickLinks,
  footerText: ""
};

const socialMeta: Array<{ key: SocialKey; label: string }> = [
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" }
];

function normalizeQuickLinks(input: unknown): QuickLink[] {
  if (!Array.isArray(input)) return [];

  const links = input
    .slice(0, 8)
    .map((item: any, index): QuickLink => ({
      id: String(item?.id || `quick-link-${index + 1}`),
      label: String(item?.label || "").trim(),
      href: String(item?.href || "").trim()
    }))
    .filter((link) => link.label && link.href);

  return links;
}

function normalizeFooterSettings(input: unknown): FooterSettings {
  const data = (input || {}) as Record<string, any>;

  return {
    churchName: String(data.churchName || ""),
    description: String(data?.seo?.description || ""),
    contactInfo: {
      phone: String(data?.contactInfo?.phone || ""),
      email: String(data?.contactInfo?.email || ""),
      address: String(data?.contactInfo?.address || "")
    },
    socialLinks: {
      facebook: String(data?.socialLinks?.facebook || ""),
      youtube: String(data?.socialLinks?.youtube || ""),
      instagram: String(data?.socialLinks?.instagram || ""),
      whatsapp: String(data?.socialLinks?.whatsapp || "")
    },
    quickLinks: normalizeQuickLinks(data.quickLinks),
    footerText: String(data.footerText || "").trim()
  };
}

function SocialIcon({ type }: { type: SocialKey }) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8.2h2.8l.5-3.2h-3.3V8.5c0-.9.3-1.5 1.6-1.5h1.8V4.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.1H7.6v3.2h2.8V22h3.1Z" />
      </svg>
    );
  }

  if (type === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M22 12c0 3.2-.3 5-.6 6-.2.9-.9 1.6-1.8 1.8-1.6.4-7.6.4-7.6.4s-6 0-7.6-.4a2.5 2.5 0 0 1-1.8-1.8C2.3 17 2 15.2 2 12s.3-5 .6-6c.2-.9.9-1.6 1.8-1.8C6 3.8 12 3.8 12 3.8s6 0 7.6.4c.9.2 1.6.9 1.8 1.8.3 1 .6 2.8.6 6ZM10 15.5l5.2-3.5L10 8.5v7Z" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.1-.7.2l-.6.8c-.2.2-.4.3-.7.1-.3-.2-1.1-.4-2-1.3-.8-.8-1.3-1.7-1.4-2-.1-.3 0-.5.2-.6l.5-.6c.2-.2.3-.5.4-.7.1-.2 0-.4 0-.6s-.7-1.8-1-2.5c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8 0 1.7 1.2 3.3 1.4 3.6.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.8-.8 2-1.6.3-.8.3-1.5.2-1.6 0-.1-.2-.2-.5-.4Z" />
      <path
        d="M20 12A8 8 0 0 1 7.4 18.6L4 20l1.5-3.2A8 8 0 1 1 20 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function SiteFooter() {
  const [settings, setSettings] = useState<FooterSettings>(emptySettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const response = await api.get<{ ok: boolean; data: Record<string, unknown> }>("/public/site-settings", { params: { t: Date.now() } });
        const normalized = normalizeFooterSettings(response.data?.data);
        if (!cancelled) {
          setSettings(normalized);
        }
      } catch {
        if (!cancelled) {
          setSettings(emptySettings);
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

  const socialItems = useMemo(
    () =>
      socialMeta
        .map((item) => ({
          ...item,
          href: settings.socialLinks[item.key]?.trim()
        }))
        .filter((item) => item.href),
    [settings.socialLinks]
  );

  const footerCopy =
    settings.footerText ||
    (settings.churchName
      ? `(c) ${new Date().getFullYear()} ${settings.churchName}. Haki zote zimehifadhiwa.`
      : "No data");

  return (
    <footer className="w-full bg-gradient-to-br from-church-900 via-[#1a2b74] to-[#0e1b49] text-church-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-[0.08em] text-white">
              {settings.churchName || (isLoading ? "Loading..." : "No data")}
            </h2>
            <p className="mt-2 text-sm text-church-100/85">
              {settings.description || (isLoading ? "Loading..." : "No data")}
            </p>
            <div className="mt-4 space-y-1 text-sm text-church-50/95">
              <p>{settings.contactInfo.address || (isLoading ? "Loading..." : "No data")}</p>
              <p>{settings.contactInfo.phone || (isLoading ? "Loading..." : "No data")}</p>
              <p>{settings.contactInfo.email || (isLoading ? "Loading..." : "No data")}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-church-100/90">
              Topbar Links
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {settings.quickLinks.length > 0 ? (
                settings.quickLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    {link.label}
                  </a>
                ))
              ) : (
                <p className="col-span-2 rounded-lg border border-dashed border-white/30 px-3 py-2 text-sm text-white/80">
                  {isLoading ? "Loading..." : "No data"}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-church-100/90">
              Social Links
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {socialItems.length > 0 ? (
                socialItems.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <SocialIcon type={social.key} />
                    {social.label}
                  </a>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-white/30 px-3 py-2 text-sm text-white/80">
                  {isLoading ? "Loading..." : "No data"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4">
          <p className="text-xs text-church-100/85">{footerCopy}</p>
          <a
            href="/admin/login"
            className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white/20"
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}

