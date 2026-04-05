import { ActivityDbModel } from "../database/models/activityDbModel.js";
import { generateId } from "../utils/id.js";

const MAX_LOGS = 100;

async function trimActivities() {
  const overflow = await ActivityDbModel.find()
    .sort({ createdAt: -1 })
    .skip(MAX_LOGS)
    .select({ _id: 1 });

  if (overflow.length === 0) return;

  const ids = overflow.map((item: any) => item._id);
  await ActivityDbModel.deleteMany({ _id: { $in: ids } });
}

export function addActivity({ userId, userName, action, entity, entityId, detail }) {
  void ActivityDbModel.create({
    id: generateId("act"),
    userId: userId || "",
    userName: userName || "",
    action,
    entity,
    entityId,
    detail,
    createdAt: new Date().toISOString()
  })
    .then(() => trimActivities())
    .catch(() => {
      // ignore activity logging failures
    });
}

export async function listActivities(limit = 20) {
  const size = Math.max(Number(limit) || 20, 1);
  return ActivityDbModel.find().sort({ createdAt: -1 }).limit(size).lean();
}
