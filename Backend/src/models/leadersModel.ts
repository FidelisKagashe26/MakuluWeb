import { LeaderDbModel } from "../database/models/leaderDbModel.js";
import { generateId } from "../utils/id.js";
import { normalizeUploadPath } from "../utils/uploadPath.js";

export async function listLeaders() {
  const items = await LeaderDbModel.find().lean();
  return items.map((item: any) => ({
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl)
  }));
}

export async function findLeaderById(id) {
  const item = await LeaderDbModel.findOne({ id }).lean();
  if (!item) return null;

  return {
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl)
  };
}

export async function createLeader(payload) {
  const total = await LeaderDbModel.countDocuments();

  const leader = {
    id: generateId("ldr"),
    name: payload.name,
    title: payload.title,
    biography: payload.biography || "",
    imageUrl: normalizeUploadPath(payload.imageUrl),
    order: Number(payload.order) || total + 1
  };

  await LeaderDbModel.create(leader);
  return leader;
}

export async function updateLeader(id, payload) {
  const nextPayload = {
    ...(payload || {})
  };

  if (Object.prototype.hasOwnProperty.call(nextPayload, "imageUrl")) {
    nextPayload.imageUrl = normalizeUploadPath(nextPayload.imageUrl);
  }

  const updated = await LeaderDbModel.findOneAndUpdate(
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

export async function deleteLeader(id) {
  const result = await LeaderDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}

