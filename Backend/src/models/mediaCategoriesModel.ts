import { MediaCategoryDbModel } from "../database/models/mediaCategoryDbModel.js";
import { generateId } from "../utils/id.js";

export async function listMediaCategories() {
  return MediaCategoryDbModel.find().sort({ name: 1 }).lean();
}

export async function findMediaCategoryById(id) {
  return MediaCategoryDbModel.findOne({ id }).lean();
}

export async function createMediaCategory(payload) {
  const now = new Date().toISOString();
  const category = {
    id: generateId("mcat"),
    type: payload.type,
    name: payload.name,
    createdAt: now,
    updatedAt: now
  };

  await MediaCategoryDbModel.create(category);
  return category;
}

export async function deleteMediaCategory(id) {
  const result = await MediaCategoryDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function updateMediaCategory(id, payload) {
  return MediaCategoryDbModel.findOneAndUpdate(
    { id },
    { $set: { ...(payload || {}), updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  ).lean();
}
