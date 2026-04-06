export function normalizeUploadPath(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const pathName = String(parsed.pathname || "");
    const lowerPathName = pathName.toLowerCase();

    if (lowerPathName.startsWith("/uploads/")) {
      const joined = `${pathName}${parsed.search || ""}`;
      return normalizeUploadPath(joined);
    }

    return raw;
  } catch {
    // Keep processing when value is not an absolute URL.
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
