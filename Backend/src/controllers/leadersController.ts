import type { Request, Response } from "express";
import {
  createLeader,
  deleteLeader,
  listLeaders,
  updateLeader
} from "../models/leadersModel.js";
import { paginate } from "../utils/pagination.js";

export async function getLeaders(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 9);
    const sort = String(req.query.sort || "order");

    const leaders = await listLeaders();
    const sorted = [...leaders].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      return Number(a.order || 0) - Number(b.order || 0);
    });

    const { items, meta } = paginate(sorted, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createLeaderHandler(req: Request, res: Response) {
  const { name, title, biography, imageUrl, order } = req.body || {};
  if (!name || !title) {
    return res.status(400).json({ ok: false, message: "Jina na cheo vinahitajika." });
  }

  try {
    const created = await createLeader({ name, title, biography, imageUrl, order });
    return res.status(201).json({ ok: true, data: created });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateLeaderHandler(req: Request, res: Response) {
  try {
    const updated = await updateLeader(req.params.leaderId, req.body || {});
    if (!updated) {
      return res.status(404).json({ ok: false, message: "Kiongozi hajapatikana." });
    }
    return res.json({ ok: true, data: updated });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteLeaderHandler(req: Request, res: Response) {
  try {
    const success = await deleteLeader(req.params.leaderId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Kiongozi hajapatikana." });
    }
    return res.json({ ok: true, message: "Kiongozi amefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
