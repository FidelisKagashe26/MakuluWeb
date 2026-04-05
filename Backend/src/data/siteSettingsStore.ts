import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
const siteSettingsFile = path.join(dataDir, "site-settings.json");

function isObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function mergeSiteSettings(defaults: Record<string, any>, saved: Record<string, any>) {
  return {
    ...defaults,
    ...saved,
    heroCarousel: Array.isArray(saved.heroCarousel)
      ? saved.heroCarousel
      : defaults.heroCarousel,
    missionSection: {
      ...defaults.missionSection,
      ...(isObject(saved.missionSection) ? saved.missionSection : {}),
      scriptureCards: Array.isArray(saved?.missionSection?.scriptureCards)
        ? saved.missionSection.scriptureCards
        : defaults.missionSection?.scriptureCards || []
    },
    contactInfo: {
      ...defaults.contactInfo,
      ...(isObject(saved.contactInfo) ? saved.contactInfo : {})
    },
    socialLinks: {
      ...defaults.socialLinks,
      ...(isObject(saved.socialLinks) ? saved.socialLinks : {})
    },
    quickLinks: Array.isArray(saved.quickLinks) ? saved.quickLinks : defaults.quickLinks,
    seo: {
      ...defaults.seo,
      ...(isObject(saved.seo) ? saved.seo : {})
    }
  };
}

function ensureParentDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function saveSiteSettings(settings: Record<string, any>) {
  try {
    ensureParentDir();
    fs.writeFileSync(siteSettingsFile, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

export function loadSiteSettings(defaults: Record<string, any>) {
  const fallback = deepClone(defaults);

  try {
    if (!fs.existsSync(siteSettingsFile)) {
      saveSiteSettings(fallback);
      return fallback;
    }

    const raw = fs.readFileSync(siteSettingsFile, "utf8").trim();
    if (!raw) {
      saveSiteSettings(fallback);
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) {
      saveSiteSettings(fallback);
      return fallback;
    }

    return mergeSiteSettings(fallback, parsed);
  } catch {
    return fallback;
  }
}
