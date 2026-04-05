import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: "" },
    userName: { type: String, default: "" },
    action: { type: String, default: "" },
    entity: { type: String, default: "" },
    entityId: { type: String, default: "" },
    detail: { type: String, default: "" },
    createdAt: { type: String, required: true, index: true }
  },
  {
    collection: "activities",
    versionKey: false
  }
);

export const ActivityDbModel: any =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);

