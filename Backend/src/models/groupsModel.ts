import { GroupDbModel } from "../database/models/groupDbModel.js";
import { generateId } from "../utils/id.js";
import { normalizeUploadPath } from "../utils/uploadPath.js";

export async function listGroups() {
  const items = await GroupDbModel.find().lean();
  return items.map((item: any) => ({
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl)
  }));
}

export async function findGroupById(id) {
  const item = await GroupDbModel.findOne({ id }).lean();
  if (!item) return null;

  return {
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl)
  };
}

export async function createGroup(payload) {
  const group = {
    id: generateId("grp"),
    name: payload.name,
    description: payload.description || "",
    imageUrl: normalizeUploadPath(payload.imageUrl),
    youtubeLink: payload.youtubeLink || "",
    type: payload.type || "Kikundi"
  };

  await GroupDbModel.create(group);
  return group;
}

export async function updateGroup(id, payload) {
  const nextPayload = {
    ...(payload || {})
  };

  if (Object.prototype.hasOwnProperty.call(nextPayload, "imageUrl")) {
    nextPayload.imageUrl = normalizeUploadPath(nextPayload.imageUrl);
  }

  const updated = await GroupDbModel.findOneAndUpdate(
    { id },
    { $set: nextPayload },
    { returnDocument: "after" }
  ).lean();

  if (!updated) return null;

  return {
    ...updated,
    imageUrl: normalizeUploadPath(updated?.imageUrl)
  };
}

export async function deleteGroup(id) {
  const result = await GroupDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}

