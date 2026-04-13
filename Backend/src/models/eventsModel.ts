import { EventDbModel } from "../database/models/eventDbModel.js";
import { generateId } from "../utils/id.js";

function toTimestamp(input: unknown) {
  const ts = new Date(String(input || "")).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function computeStatus(item: any, now = new Date()) {
  if (!item?.isPublished) return "draft";

  const current = now.getTime();
  const start = toTimestamp(item.startDate);
  const end = toTimestamp(item.endDate);
  if (start === null || end === null) return "draft";

  if (current < start) return "upcoming";
  if (current > end) return "past";
  return "ongoing";
}

function mapEvent(item: any) {
  return {
    ...item,
    title: String(item.title || ""),
    summary: String(item.summary || ""),
    content: String(item.content || ""),
    imageUrl: String(item.imageUrl || ""),
    category: String(item.category || ""),
    actionLabel: String(item.actionLabel || ""),
    isFeatured: Boolean(item.isFeatured),
    location: String(item.location || ""),
    startDate: String(item.startDate || ""),
    endDate: String(item.endDate || ""),
    isPublished: Boolean(item.isPublished),
    status: computeStatus(item)
  };
}

export async function listEvents(options = { includeDraft: true }) {
  const events = await EventDbModel.find().sort({ startDate: -1 }).lean();
  const mapped = events.map((item) => mapEvent(item));

  if (options?.includeDraft) return mapped;
  return mapped.filter((item) => item.isPublished);
}

export async function listPublicEvents() {
  return listEvents({ includeDraft: false });
}

export async function findEventById(id: string) {
  const event = await EventDbModel.findOne({ id }).lean();
  if (!event) return null;
  return mapEvent(event);
}

export async function createEvent(payload: any) {
  const now = new Date().toISOString();
  const item = {
    id: generateId("evt"),
    title: String(payload.title || ""),
    summary: String(payload.summary || ""),
    content: String(payload.content || ""),
    imageUrl: String(payload.imageUrl || ""),
    category: String(payload.category || ""),
    actionLabel: String(payload.actionLabel || ""),
    isFeatured: Boolean(payload.isFeatured),
    location: String(payload.location || ""),
    startDate: String(payload.startDate || ""),
    endDate: String(payload.endDate || ""),
    isPublished: Boolean(payload.isPublished),
    createdAt: now,
    updatedAt: now,
    createdById: String(payload.createdById || ""),
    createdByName: String(payload.createdByName || ""),
    updatedById: String(payload.updatedById || payload.createdById || ""),
    updatedByName: String(payload.updatedByName || payload.createdByName || "")
  };

  await EventDbModel.create(item);
  return mapEvent(item);
}

export async function updateEvent(id: string, payload: any) {
  const patch = {
    ...(payload || {}),
    updatedAt: new Date().toISOString()
  };

  const item = await EventDbModel.findOneAndUpdate(
    { id },
    { $set: patch },
    { returnDocument: "after" }
  ).lean();

  if (!item) return null;
  return mapEvent(item);
}

export async function deleteEvent(id: string) {
  const result = await EventDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}
