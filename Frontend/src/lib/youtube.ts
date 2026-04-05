const YOUTUBE_ID_REGEX = /^[\w-]{11}$/;

export function extractYouTubeId(input: string) {
  if (!input) return null;
  const raw = input.trim();

  if (YOUTUBE_ID_REGEX.test(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const candidate = url.pathname.replace("/", "");
      return YOUTUBE_ID_REGEX.test(candidate) ? candidate : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId && YOUTUBE_ID_REGEX.test(watchId)) return watchId;

      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2 && (pathParts[0] === "embed" || pathParts[0] === "shorts")) {
        return YOUTUBE_ID_REGEX.test(pathParts[1]) ? pathParts[1] : null;
      }
    }
  } catch {
    const match = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    return match ? match[1] : null;
  }

  return null;
}

export function toYouTubeEmbedUrl(input: string) {
  const id = extractYouTubeId(input);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
