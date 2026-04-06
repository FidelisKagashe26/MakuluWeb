import { MediaDbModel } from "../database/models/mediaDbModel.js";
import { generateId } from "../utils/id.js";
import { normalizeUploadPath } from "../utils/uploadPath.js";

export async function listMedia() {
  const items = await MediaDbModel.find().sort({ createdAt: -1 }).lean();
  return items.map((item: any) => ({
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl),
    thumbnailUrl: normalizeUploadPath(item?.thumbnailUrl)
  }));
}

export async function findMediaById(id) {
  const item = await MediaDbModel.findOne({ id }).lean();
  if (!item) return null;

  return {
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl),
    thumbnailUrl: normalizeUploadPath(item?.thumbnailUrl)
  };
}

export async function createMedia(payload) {
  const now = new Date().toISOString();
  const media = {
    id: generateId("med"),
    category: payload.category,
    mediaCategoryId: payload.mediaCategoryId || "",
    title: payload.title,
    description: payload.description || "",
    imageUrl: normalizeUploadPath(payload.imageUrl),
    videoUrl: payload.videoUrl || "",
    thumbnailUrl: normalizeUploadPath(payload.thumbnailUrl),
    createdAt: now,
    updatedAt: now
  };

  await MediaDbModel.create(media);
  return media;
}

export async function updateMedia(id, payload) {
  const nextPayload = {
    ...(payload || {})
  };

  if (Object.prototype.hasOwnProperty.call(nextPayload, "imageUrl")) {
    nextPayload.imageUrl = normalizeUploadPath(nextPayload.imageUrl);
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, "thumbnailUrl")) {
    nextPayload.thumbnailUrl = normalizeUploadPath(nextPayload.thumbnailUrl);
  }

  const updated = await MediaDbModel.findOneAndUpdate(
    { id },
    { $set: { ...nextPayload, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  ).lean();

  if (!updated) return null;

  return {
    ...updated,
    imageUrl: normalizeUploadPath(updated?.imageUrl),
    thumbnailUrl: normalizeUploadPath(updated?.thumbnailUrl)
  };
}

export async function deleteMedia(id) {
  const result = await MediaDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}
