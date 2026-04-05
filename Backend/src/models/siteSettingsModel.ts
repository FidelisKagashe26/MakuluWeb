import { defaultSiteSettings } from "../data/defaultSiteSettings.js";
import { SiteSettingsDbModel } from "../database/models/siteSettingsDbModel.js";

function toFiniteNumber(value: unknown, fallback: number | null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeLibraryPdfUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const pathName = String(parsed.pathname || "");
    const lowerPathName = pathName.toLowerCase();
    if (lowerPathName.startsWith("/uploads/")) {
      const joined = `${pathName}${parsed.search || ""}`;
      return normalizeLibraryPdfUrl(joined);
    }
    return raw;
  } catch {
    // Continue with raw value when it is not an absolute URL.
  }

  const normalized = raw.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();
  const uploadsIndex = lower.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  if (lower.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  return normalized;
}

function stripSystemFields(document: any) {
  if (!document) return null;

  const source = typeof document.toObject === "function" ? document.toObject() : document;
  const { _id, key, ...settings } = source || {};
  return settings;
}

export async function getSiteSettings() {
  let settingsDoc = await SiteSettingsDbModel.findOne({ key: "main" });

  if (!settingsDoc) {
    settingsDoc = await SiteSettingsDbModel.create({
      key: "main",
      ...defaultSiteSettings
    });
  }

  return stripSystemFields(settingsDoc);
}

export async function updateSiteSettings(payload) {
  const current = (await getSiteSettings()) || defaultSiteSettings;

  const hasMissionCards = Array.isArray(payload?.missionSection?.scriptureCards);
  const hasQuickLinks = Array.isArray(payload?.quickLinks);
  const hasLibraryItems = Array.isArray(payload?.libraryItems);
  const mergedQuickLinks = hasQuickLinks
    ? payload.quickLinks
        .slice(0, 8)
        .map((item, index) => ({
          id: String(item?.id || `quick-link-${index + 1}`),
          label: String(item?.label || "").trim(),
          href: String(item?.href || "").trim()
        }))
        .filter((item) => item.label && item.href)
    : current.quickLinks || [];
  const mergedLibraryItems = hasLibraryItems
    ? payload.libraryItems
        .slice(0, 200)
        .map((item, index) => ({
          id: String(item?.id || `library-item-${index + 1}`),
          title: String(item?.title || "").trim(),
          description: String(item?.description || "").trim(),
          pdfUrl: normalizeLibraryPdfUrl(item?.pdfUrl),
          fileName: String(item?.fileName || "").trim(),
          uploadedAt: String(item?.uploadedAt || "").trim()
        }))
        .filter((item) => item.title && item.pdfUrl)
    : current.libraryItems || [];
  const mergedMapLocation = {
    ...(current.mapLocation || {}),
    ...(payload?.mapLocation || {}),
    latitude: toFiniteNumber(payload?.mapLocation?.latitude, current.mapLocation?.latitude ?? null),
    longitude: toFiniteNumber(
      payload?.mapLocation?.longitude,
      current.mapLocation?.longitude ?? null
    ),
    zoom: toFiniteNumber(payload?.mapLocation?.zoom, current.mapLocation?.zoom ?? 15),
    label: String(payload?.mapLocation?.label ?? current.mapLocation?.label ?? "").trim()
  };

  const merged = {
    ...current,
    ...payload,
    missionSection: {
      ...current.missionSection,
      ...(payload?.missionSection || {}),
      scriptureCards: hasMissionCards
        ? payload.missionSection.scriptureCards
        : current.missionSection?.scriptureCards || []
    },
    contactInfo: {
      ...current.contactInfo,
      ...(payload?.contactInfo || {})
    },
    socialLinks: {
      ...current.socialLinks,
      ...(payload?.socialLinks || {})
    },
    mapLocation: mergedMapLocation,
    aboutChurch: {
      ...current.aboutChurch,
      ...(payload?.aboutChurch || {})
    },
    quickLinks: mergedQuickLinks,
    libraryItems: mergedLibraryItems,
    seo: {
      ...current.seo,
      ...(payload?.seo || {})
    }
  };

  const saved = await SiteSettingsDbModel.findOneAndUpdate(
    { key: "main" },
    { $set: merged, $setOnInsert: { key: "main" } },
    { returnDocument: "after", upsert: true }
  );

  return stripSystemFields(saved);
}

