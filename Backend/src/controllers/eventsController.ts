import type { Request, Response } from "express";
import { clearApiCache } from "../middleware/cacheMiddleware.js";
import {
  createEvent,
  deleteEvent,
  findEventById,
  listEvents,
  listPublicEvents,
  updateEvent
} from "../models/eventsModel.js";
import { paginate } from "../utils/pagination.js";

const EVENT_STATUSES = ["draft", "upcoming", "ongoing", "past"];

function normalizeStatus(input: unknown) {
  const value = String(input || "").trim().toLowerCase();
  return EVENT_STATUSES.includes(value) ? value : "";
}

function stripHtmlToPlainText(input: string) {
  return String(input || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferSummary(summary: string, content: string) {
  const cleanedSummary = String(summary || "").trim();
  if (cleanedSummary) return cleanedSummary;

  const plain = stripHtmlToPlainText(content).replace(/\s+/g, " ").trim();
  if (!plain) return "";
  if (plain.length <= 220) return plain;
  return `${plain.slice(0, 220).trimEnd()}...`;
}

function normalizeEventInput(body: any) {
  const title = String(body?.title || "").trim();
  const content = String(body?.content || "").trim();
  const summary = inferSummary(String(body?.summary || ""), content);
  const imageUrl = String(body?.imageUrl || "").trim();
  const location = String(body?.location || "").trim();
  const startDate = String(body?.startDate || "").trim();
  const endDate = String(body?.endDate || "").trim();
  const isPublished =
    typeof body?.isPublished === "boolean"
      ? body.isPublished
      : String(body?.isPublished || "").trim().toLowerCase() === "false"
        ? false
        : true;

  return {
    title,
    summary,
    content,
    imageUrl,
    location,
    startDate,
    endDate,
    isPublished
  };
}

function isValidDate(input: string) {
  if (!input) return false;
  const ts = new Date(input).getTime();
  return !Number.isNaN(ts);
}

export async function getEvents(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const status = normalizeStatus(req.query.status);
    const search = String(req.query.search || "").trim().toLowerCase();
    const source = await listEvents({ includeDraft: true });

    const filtered = source.filter((item: any) => {
      if (status && item.status !== status) return false;
      if (!search) return true;

      return (
        String(item.title || "").toLowerCase().includes(search) ||
        String(item.summary || "").toLowerCase().includes(search) ||
        String(item.content || "").toLowerCase().includes(search) ||
        String(item.location || "").toLowerCase().includes(search)
      );
    });

    const { items, meta } = paginate(filtered, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function getPublicEvents(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const status = normalizeStatus(req.query.status);
    const search = String(req.query.search || "").trim().toLowerCase();
    const source = await listPublicEvents();

    const filtered = source.filter((item: any) => {
      if (status && item.status !== status) return false;
      if (!search) return true;

      return (
        String(item.title || "").toLowerCase().includes(search) ||
        String(item.summary || "").toLowerCase().includes(search) ||
        String(item.content || "").toLowerCase().includes(search) ||
        String(item.location || "").toLowerCase().includes(search)
      );
    });

    const { items, meta } = paginate(filtered, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createEventHandler(req: Request, res: Response) {
  const payload = normalizeEventInput(req.body || {});
  if (!payload.title) {
    return res.status(400).json({ ok: false, message: "Title inahitajika." });
  }

  if (!isValidDate(payload.startDate) || !isValidDate(payload.endDate)) {
    return res.status(400).json({ ok: false, message: "Start date na end date sahihi zinahitajika." });
  }

  if (new Date(payload.startDate).getTime() > new Date(payload.endDate).getTime()) {
    return res.status(400).json({ ok: false, message: "startDate haiwezi kuwa kubwa kuliko endDate." });
  }

  try {
    const created = await createEvent({
      ...payload,
      createdById: req.auth?.id || "",
      createdByName: req.auth?.fullName || "",
      updatedById: req.auth?.id || "",
      updatedByName: req.auth?.fullName || ""
    });

    clearApiCache();
    return res.status(201).json({ ok: true, data: created });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateEventHandler(req: Request, res: Response) {
  try {
    const current = await findEventById(req.params.eventId);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Tukio halijapatikana." });
    }

    const payload = normalizeEventInput({ ...current, ...(req.body || {}) });
    if (!payload.title) {
      return res.status(400).json({ ok: false, message: "Title inahitajika." });
    }

    if (!isValidDate(payload.startDate) || !isValidDate(payload.endDate)) {
      return res.status(400).json({ ok: false, message: "Start date na end date sahihi zinahitajika." });
    }

    if (new Date(payload.startDate).getTime() > new Date(payload.endDate).getTime()) {
      return res.status(400).json({ ok: false, message: "startDate haiwezi kuwa kubwa kuliko endDate." });
    }

    const updated = await updateEvent(current.id, {
      ...payload,
      updatedById: req.auth?.id || "",
      updatedByName: req.auth?.fullName || ""
    });

    clearApiCache();
    return res.json({ ok: true, data: updated });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteEventHandler(req: Request, res: Response) {
  try {
    const success = await deleteEvent(req.params.eventId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Tukio halijapatikana." });
    }

    clearApiCache();
    return res.json({ ok: true, message: "Tukio limefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

