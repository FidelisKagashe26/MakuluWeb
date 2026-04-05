import { LeaderDbModel } from "../database/models/leaderDbModel.js";
import { generateId } from "../utils/id.js";

export async function listLeaders() {
  return LeaderDbModel.find().lean();
}

export async function findLeaderById(id) {
  return LeaderDbModel.findOne({ id }).lean();
}

export async function createLeader(payload) {
  const total = await LeaderDbModel.countDocuments();

  const leader = {
    id: generateId("ldr"),
    name: payload.name,
    title: payload.title,
    biography: payload.biography || "",
    imageUrl: payload.imageUrl || "",
    order: Number(payload.order) || total + 1
  };

  await LeaderDbModel.create(leader);
  return leader;
}

export async function updateLeader(id, payload) {
  return LeaderDbModel.findOneAndUpdate({ id }, { $set: payload || {} }, { returnDocument: "after" }).lean();
}

export async function deleteLeader(id) {
  const result = await LeaderDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}

