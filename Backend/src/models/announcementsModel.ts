import { AnnouncementDbModel } from "../database/models/announcementDbModel.js";
import { generateId } from "../utils/id.js";

function toTimestamp(input) {
  const ts = new Date(String(input || "")).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function computeStatus(item, now = new Date()) {
  if (String(item.workflowStatus || "published") !== "published") {
    return "draft";
  }

  const current = now.getTime();
  const start = toTimestamp(item.startDate);
  const end = toTimestamp(item.endDate);
  if (start === null || end === null) return "draft";

  if (current < start) return "scheduled";
  if (current > end) return "expired";
  return "active";
}

function mapAnnouncement(item) {
  return {
    ...item,
    summary: String(item.summary || ""),
    documentData: item.documentData || null,
    type: String(item.type || "ongoing"),
    workflowStatus: String(item.workflowStatus || "published"),
    status: computeStatus(item)
  };
}

export async function listAnnouncements(options = { includeDraft: true }) {
  const announcements = await AnnouncementDbModel.find().sort({ startDate: -1 }).lean();
  const mapped = announcements.map((item) => mapAnnouncement(item));

  if (options?.includeDraft) return mapped;
  return mapped.filter((item) => item.workflowStatus === "published");
}

export async function listActiveAnnouncements() {
  const items = await listAnnouncements({ includeDraft: false });
  return items.filter((item) => item.status === "active");
}

export async function listPublicAnnouncements() {
  return listAnnouncements({ includeDraft: false });
}

export async function findAnnouncementById(id) {
  const announcement = await AnnouncementDbModel.findOne({ id }).lean();
  if (!announcement) return null;
  return mapAnnouncement(announcement);
}

export async function createAnnouncement(payload) {
  const now = new Date().toISOString();
  const item = {
    id: generateId("ann"),
    title: String(payload.title || ""),
    summary: String(payload.summary || ""),
    content: String(payload.content || ""),
    type: String(payload.type || "ongoing"),
    workflowStatus: String(payload.workflowStatus || "draft"),
    startDate: String(payload.startDate || ""),
    endDate: String(payload.endDate || ""),
    documentData: payload.documentData || null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    createdById: String(payload.createdById || ""),
    createdByName: String(payload.createdByName || ""),
    updatedById: String(payload.updatedById || payload.createdById || ""),
    updatedByName: String(payload.updatedByName || payload.createdByName || "")
  };

  await AnnouncementDbModel.create(item);
  return mapAnnouncement(item);
}

export async function updateAnnouncement(id, payload) {
  const patch = {
    ...(payload || {}),
    updatedAt: new Date().toISOString()
  };
  const item = await AnnouncementDbModel.findOneAndUpdate(
    { id },
    { $set: patch },
    { returnDocument: "after" }
  ).lean();

  if (!item) return null;
  return mapAnnouncement(item);
}

export async function deleteAnnouncement(id) {
  const result = await AnnouncementDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}

