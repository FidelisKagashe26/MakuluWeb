import { MediaDbModel } from "../database/models/mediaDbModel.js";
import { generateId } from "../utils/id.js";

export async function listMedia() {
  return MediaDbModel.find().sort({ createdAt: -1 }).lean();
}

export async function findMediaById(id) {
  return MediaDbModel.findOne({ id }).lean();
}

export async function createMedia(payload) {
  const now = new Date().toISOString();
  const media = {
    id: generateId("med"),
    category: payload.category,
    mediaCategoryId: payload.mediaCategoryId || "",
    title: payload.title,
    description: payload.description || "",
    imageUrl: payload.imageUrl || "",
    videoUrl: payload.videoUrl || "",
    thumbnailUrl: payload.thumbnailUrl || "",
    createdAt: now,
    updatedAt: now
  };

  await MediaDbModel.create(media);
  return media;
}

export async function updateMedia(id, payload) {
  return MediaDbModel.findOneAndUpdate(
    { id },
    { $set: { ...(payload || {}), updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  ).lean();
}

export async function deleteMedia(id) {
  const result = await MediaDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}
