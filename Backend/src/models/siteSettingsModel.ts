import { defaultSiteSettings } from "../data/defaultSiteSettings.js";
import { SiteSettingsDbModel } from "../database/models/siteSettingsDbModel.js";
import { normalizeUploadPath } from "../utils/uploadPath.js";

function toFiniteNumber(value: unknown, fallback: number | null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeLibraryPdfUrl(value: unknown) {
  return normalizeUploadPath(value);
}

function normalizeHeroCarousel(input: unknown): any[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, 10)
    .map((item: any, index) => ({
      id: String(item?.id || `slide-${index + 1}`),
      badge: String(item?.badge || "").trim(),
      title: String(item?.title || "").trim(),
      scripture: String(item?.scripture || "").trim(),
      description: String(item?.description || "").trim(),
      primaryLabel: String(item?.primaryLabel || "").trim(),
      primaryHref: String(item?.primaryHref || "").trim(),
      secondaryLabel: String(item?.secondaryLabel || "").trim(),
      secondaryHref: String(item?.secondaryHref || "").trim(),
      brightness: String(item?.brightness || "dark"),
      imageUrl: normalizeUploadPath(item?.imageUrl)
    }))
    .filter((item) => item.title || item.imageUrl);
}

function normalizeMissionSection(input: unknown): any {
  const section = (input || {}) as Record<string, any>;
  const scriptureCards = Array.isArray(section.scriptureCards)
    ? section.scriptureCards
        .slice(0, 6)
        .map((card: any, index: number) => ({
          id: String(card?.id || `mission-card-${index + 1}`),
          reference: String(card?.reference || "").trim(),
          content: String(card?.content || "").trim()
        }))
        .filter((card) => card.reference || card.content)
    : [];

  return {
    ...section,
    sectionTitle: String(section.sectionTitle || "").trim(),
    statementTitle: String(section.statementTitle || "").trim(),
    statementQuote: String(section.statementQuote || "").trim(),
    imageUrl: normalizeUploadPath(section.imageUrl),
    imageAlt: String(section.imageAlt || "").trim(),
    scriptureCards
  };
}

function normalizeAboutChurch(input: unknown): any {
  const section = (input || {}) as Record<string, any>;
  return {
    ...section,
    title: String(section.title || "").trim(),
    content: String(section.content || "").trim(),
    imageUrl: normalizeUploadPath(section.imageUrl),
    imageAlt: String(section.imageAlt || "").trim()
  };
}

function normalizeSiteSettings(settings: any): any {
  const source = (settings || {}) as Record<string, any>;
  const libraryItems = Array.isArray(source.libraryItems)
    ? source.libraryItems
        .slice(0, 200)
        .map((item: any, index: number) => ({
          ...item,
          id: String(item?.id || `library-item-${index + 1}`),
          title: String(item?.title || "").trim(),
          description: String(item?.description || "").trim(),
          pdfUrl: normalizeLibraryPdfUrl(item?.pdfUrl),
          fileName: String(item?.fileName || "").trim(),
          uploadedAt: String(item?.uploadedAt || "").trim()
        }))
        .filter((item) => item.title && item.pdfUrl)
    : [];

  return {
    ...source,
    logoUrl: normalizeUploadPath(source.logoUrl),
    faviconUrl: normalizeUploadPath(source.faviconUrl),
    heroCarousel: normalizeHeroCarousel(source.heroCarousel),
    missionSection: normalizeMissionSection(source.missionSection),
    aboutChurch: normalizeAboutChurch(source.aboutChurch),
    libraryItems
  };
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

  return normalizeSiteSettings(stripSystemFields(settingsDoc));
}

export async function updateSiteSettings(payload) {
  const current = (await getSiteSettings()) || defaultSiteSettings;

  const hasMissionCards = Array.isArray(payload?.missionSection?.scriptureCards);
  const hasHeroCarousel = Array.isArray(payload?.heroCarousel);
  const hasQuickLinks = Array.isArray(payload?.quickLinks);
  const hasLibraryItems = Array.isArray(payload?.libraryItems);
  const mergedHeroCarousel = hasHeroCarousel ? normalizeHeroCarousel(payload.heroCarousel) : current.heroCarousel || [];
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
    logoUrl: normalizeUploadPath(payload?.logoUrl ?? current.logoUrl ?? ""),
    faviconUrl: normalizeUploadPath(payload?.faviconUrl ?? current.faviconUrl ?? ""),
    heroCarousel: mergedHeroCarousel,
    missionSection: {
      ...current.missionSection,
      ...(payload?.missionSection || {}),
      imageUrl: normalizeUploadPath(
        payload?.missionSection?.imageUrl ?? current.missionSection?.imageUrl ?? ""
      ),
      imageAlt: String(
        payload?.missionSection?.imageAlt ?? current.missionSection?.imageAlt ?? ""
      ).trim(),
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
      ...(payload?.aboutChurch || {}),
      imageUrl: normalizeUploadPath(payload?.aboutChurch?.imageUrl ?? current.aboutChurch?.imageUrl ?? ""),
      imageAlt: String(payload?.aboutChurch?.imageAlt ?? current.aboutChurch?.imageAlt ?? "").trim()
    },
    quickLinks: mergedQuickLinks,
    libraryItems: mergedLibraryItems,
    seo: {
      ...current.seo,
      ...(payload?.seo || {})
    }
  };

  const normalized = normalizeSiteSettings(merged);

  const saved = await SiteSettingsDbModel.findOneAndUpdate(
    { key: "main" },
    { $set: normalized, $setOnInsert: { key: "main" } },
    { returnDocument: "after", upsert: true }
  );

  return normalizeSiteSettings(stripSystemFields(saved));
}

