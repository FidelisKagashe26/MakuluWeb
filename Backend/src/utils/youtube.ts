const ID_REGEX = /^[\w-]{11}$/;

export function extractYouTubeId(input: string) {
  if (!input) return null;
  const raw = input.trim();

  if (ID_REGEX.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return ID_REGEX.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId && ID_REGEX.test(watchId)) return watchId;

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && (parts[0] === "embed" || parts[0] === "shorts")) {
        return ID_REGEX.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    const match = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    return match ? match[1] : null;
  }

  return null;
}

export function toEmbedUrl(input: string) {
  const id = extractYouTubeId(input);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
