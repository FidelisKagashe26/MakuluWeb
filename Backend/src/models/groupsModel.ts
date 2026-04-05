import { GroupDbModel } from "../database/models/groupDbModel.js";
import { generateId } from "../utils/id.js";

export async function listGroups() {
  return GroupDbModel.find().lean();
}

export async function findGroupById(id) {
  return GroupDbModel.findOne({ id }).lean();
}

export async function createGroup(payload) {
  const group = {
    id: generateId("grp"),
    name: payload.name,
    description: payload.description || "",
    imageUrl: payload.imageUrl || "",
    youtubeLink: payload.youtubeLink || "",
    type: payload.type || "Kikundi"
  };

  await GroupDbModel.create(group);
  return group;
}

export async function updateGroup(id, payload) {
  return GroupDbModel.findOneAndUpdate({ id }, { $set: payload || {} }, { returnDocument: "after" }).lean();
}

export async function deleteGroup(id) {
  const result = await GroupDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}

