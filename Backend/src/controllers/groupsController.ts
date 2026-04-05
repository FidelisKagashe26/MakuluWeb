import type { Request, Response } from "express";
import {
  createGroup,
  deleteGroup,
  listGroups,
  updateGroup
} from "../models/groupsModel.js";
import { paginate } from "../utils/pagination.js";
import { toEmbedUrl } from "../utils/youtube.js";

export async function getGroups(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 9);
    const search = String(req.query.search || "").toLowerCase();

    const groups = await listGroups();
    const filtered = groups
      .filter((group) => {
        if (!search) return true;
        return (
          group.name.toLowerCase().includes(search) ||
          group.description.toLowerCase().includes(search)
        );
      })
      .map((group) => ({
        ...group,
        youtubeEmbedUrl: group.youtubeLink ? toEmbedUrl(group.youtubeLink) : null
      }));

    const { items, meta } = paginate(filtered, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createGroupHandler(req: Request, res: Response) {
  const { name, description, imageUrl, youtubeLink, type } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, message: "Jina la kikundi linahitajika." });
  }

  try {
    const created = await createGroup({ name, description, imageUrl, youtubeLink, type });
    return res.status(201).json({
      ok: true,
      data: {
        ...created,
        youtubeEmbedUrl: created.youtubeLink ? toEmbedUrl(created.youtubeLink) : null
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateGroupHandler(req: Request, res: Response) {
  try {
    const updated = await updateGroup(req.params.groupId, req.body || {});
    if (!updated) {
      return res.status(404).json({ ok: false, message: "Kikundi hakijapatikana." });
    }
    return res.json({
      ok: true,
      data: {
        ...updated,
        youtubeEmbedUrl: updated.youtubeLink ? toEmbedUrl(updated.youtubeLink) : null
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteGroupHandler(req: Request, res: Response) {
  try {
    const success = await deleteGroup(req.params.groupId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Kikundi hakijapatikana." });
    }
    return res.json({ ok: true, message: "Kikundi kimefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
