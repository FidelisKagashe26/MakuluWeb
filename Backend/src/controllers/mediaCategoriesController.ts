import type { Request, Response } from "express";
import { clearApiCache } from "../middleware/cacheMiddleware.js";
import {
  createMediaCategory,
  deleteMediaCategory,
  findMediaCategoryById,
  listMediaCategories,
  updateMediaCategory
} from "../models/mediaCategoriesModel.js";

const ALLOWED_TYPES = ["image", "video"];

function normalizeType(input: unknown) {
  const value = String(input || "").trim().toLowerCase();
  return ALLOWED_TYPES.includes(value) ? value : "";
}

export async function getMediaCategories(req: Request, res: Response) {
  try {
    const type = normalizeType(req.query.type);
    const search = String(req.query.search || "").toLowerCase();
    const rows = await listMediaCategories();

    const filtered = rows.filter((item) => {
      if (type && item.type !== type) return false;
      if (!search) return true;
      return String(item.name || "").toLowerCase().includes(search);
    });

    return res.json({ ok: true, data: filtered });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createMediaCategoryHandler(req: Request, res: Response) {
  const type = normalizeType(req.body?.type);
  const name = String(req.body?.name || "").trim();

  if (!type) {
    return res.status(400).json({ ok: false, message: "Type lazima iwe image au video." });
  }
  if (!name) {
    return res.status(400).json({ ok: false, message: "Category name inahitajika." });
  }

  try {
    const existingRows = await listMediaCategories();
    const exists = existingRows.some(
      (item) => item.type === type && String(item.name || "").toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      return res.status(409).json({ ok: false, message: "Category tayari ipo." });
    }

    const created = await createMediaCategory({ type, name });
    clearApiCache();
    return res.status(201).json({ ok: true, data: created });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteMediaCategoryHandler(req: Request, res: Response) {
  try {
    const current = await findMediaCategoryById(req.params.categoryId);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Category haijapatikana." });
    }

    const success = await deleteMediaCategory(current.id);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Category haijapatikana." });
    }

    clearApiCache();
    return res.json({ ok: true, message: "Category imefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateMediaCategoryHandler(req: Request, res: Response) {
  const name = String(req.body?.name || "").trim();
  if (!name) {
    return res.status(400).json({ ok: false, message: "Category name inahitajika." });
  }

  try {
    const current = await findMediaCategoryById(req.params.categoryId);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Category haijapatikana." });
    }

    const existingRows = await listMediaCategories();
    const exists = existingRows.some(
      (item) =>
        item.id !== current.id &&
        item.type === current.type &&
        String(item.name || "").toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      return res.status(409).json({ ok: false, message: "Category tayari ipo." });
    }

    const updated = await updateMediaCategory(current.id, { name });
    if (!updated) {
      return res.status(404).json({ ok: false, message: "Category haijapatikana." });
    }

    clearApiCache();
    return res.json({ ok: true, data: updated });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
