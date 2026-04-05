import type { Request, Response } from "express";
import { clearApiCache } from "../middleware/cacheMiddleware.js";
import {
  createMedia,
  deleteMedia,
  findMediaById,
  listMedia,
  updateMedia
} from "../models/mediaModel.js";
import {
  findMediaCategoryById,
  listMediaCategories
} from "../models/mediaCategoriesModel.js";
import { paginate } from "../utils/pagination.js";
import { toEmbedUrl } from "../utils/youtube.js";

const ALLOWED_CATEGORIES = ["image", "video"];

function normalizeCategory(input: unknown) {
  const value = String(input || "").trim().toLowerCase();
  return ALLOWED_CATEGORIES.includes(value) ? value : "";
}

function mapMediaForResponse(item: any, categoryMap: Map<string, string>) {
  const videoEmbedUrl = item.videoUrl ? toEmbedUrl(item.videoUrl) : null;
  const mediaCategoryName = categoryMap.get(String(item.mediaCategoryId || "")) || "";

  return {
    ...item,
    videoEmbedUrl,
    mediaCategoryName
  };
}

function validatePayload(payload: any) {
  const category = normalizeCategory(payload?.category);
  const title = String(payload?.title || "").trim();
  const mediaCategoryId = String(payload?.mediaCategoryId || "").trim();
  const imageUrl = String(payload?.imageUrl || "").trim();
  const videoUrl = String(payload?.videoUrl || "").trim();

  if (!category) {
    return { ok: false, message: "Category lazima iwe image au video." };
  }

  if (!title) {
    return { ok: false, message: "Title inahitajika." };
  }

  if (!mediaCategoryId) {
    return { ok: false, message: "Media category inahitajika." };
  }

  if (category === "image" && !imageUrl) {
    return { ok: false, message: "Image URL inahitajika kwa category ya image." };
  }

  if (category === "video" && !videoUrl) {
    return { ok: false, message: "Video URL inahitajika kwa category ya video." };
  }

  return { ok: true };
}

export async function getMedia(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 12);
    const search = String(req.query.search || "").toLowerCase();
    const category = normalizeCategory(req.query.category);
    const mediaCategoryId = String(req.query.mediaCategoryId || "").trim();

    const [rows, categoryRows] = await Promise.all([listMedia(), listMediaCategories()]);
    const categoryMap = new Map<string, string>(
      categoryRows.map((entry) => [String(entry.id), String(entry.name || "")])
    );
    const filtered = rows.filter((item) => {
      if (category && item.category !== category) return false;
      if (mediaCategoryId && item.mediaCategoryId !== mediaCategoryId) return false;
      if (!search) return true;

      return (
        String(item.title || "").toLowerCase().includes(search) ||
        String(item.description || "").toLowerCase().includes(search) ||
        String(categoryMap.get(String(item.mediaCategoryId || "")) || "")
          .toLowerCase()
          .includes(search)
      );
    });

    const mapped = filtered.map((item) => mapMediaForResponse(item, categoryMap));
    const { items, meta } = paginate(mapped, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createMediaHandler(req: Request, res: Response) {
  const payload = req.body || {};
  const validation = validatePayload(payload);
  if (!validation.ok) {
    return res.status(400).json({ ok: false, message: validation.message });
  }

  try {
    const mediaCategoryId = String(payload.mediaCategoryId || "").trim();
    const linkedCategory = await findMediaCategoryById(mediaCategoryId);
    if (!linkedCategory) {
      return res.status(400).json({ ok: false, message: "Media category haijapatikana." });
    }
    if (linkedCategory.type !== normalizeCategory(payload.category)) {
      return res
        .status(400)
        .json({ ok: false, message: "Category type na media type hazilingani." });
    }

    const created = await createMedia({
      category: normalizeCategory(payload.category),
      mediaCategoryId,
      title: String(payload.title || "").trim(),
      description: String(payload.description || "").trim(),
      imageUrl: String(payload.imageUrl || "").trim(),
      videoUrl: String(payload.videoUrl || "").trim(),
      thumbnailUrl: String(payload.thumbnailUrl || "").trim()
    });

    const categoryRows = await listMediaCategories();
    const categoryMap = new Map<string, string>(
      categoryRows.map((entry) => [String(entry.id), String(entry.name || "")])
    );

    clearApiCache();
    return res.status(201).json({ ok: true, data: mapMediaForResponse(created, categoryMap) });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateMediaHandler(req: Request, res: Response) {
  try {
    const current = await findMediaById(req.params.mediaId);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Media haijapatikana." });
    }

    const merged = {
      ...current,
      ...(req.body || {})
    };

    const validation = validatePayload(merged);
    if (!validation.ok) {
      return res.status(400).json({ ok: false, message: validation.message });
    }

    const nextMediaCategoryId = String(merged.mediaCategoryId || "").trim();
    const linkedCategory = await findMediaCategoryById(nextMediaCategoryId);
    if (!linkedCategory) {
      return res.status(400).json({ ok: false, message: "Media category haijapatikana." });
    }
    if (linkedCategory.type !== normalizeCategory(merged.category)) {
      return res
        .status(400)
        .json({ ok: false, message: "Category type na media type hazilingani." });
    }

    const updated = await updateMedia(current.id, {
      category: normalizeCategory(merged.category),
      mediaCategoryId: nextMediaCategoryId,
      title: String(merged.title || "").trim(),
      description: String(merged.description || "").trim(),
      imageUrl: String(merged.imageUrl || "").trim(),
      videoUrl: String(merged.videoUrl || "").trim(),
      thumbnailUrl: String(merged.thumbnailUrl || "").trim()
    });

    if (!updated) {
      return res.status(404).json({ ok: false, message: "Media haijapatikana." });
    }

    const categoryRows = await listMediaCategories();
    const categoryMap = new Map<string, string>(
      categoryRows.map((entry) => [String(entry.id), String(entry.name || "")])
    );

    clearApiCache();
    return res.json({ ok: true, data: mapMediaForResponse(updated, categoryMap) });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteMediaHandler(req: Request, res: Response) {
  try {
    const success = await deleteMedia(req.params.mediaId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Media haijapatikana." });
    }

    clearApiCache();
    return res.json({ ok: true, message: "Media imefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
