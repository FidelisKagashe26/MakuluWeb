import mongoose, { Schema } from "mongoose";

const announcementSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    summary: { type: String, default: "" },
    content: { type: String, default: "" },
    type: { type: String, default: "ongoing", index: true },
    workflowStatus: { type: String, default: "draft", index: true },
    startDate: { type: String, default: "", index: true },
    endDate: { type: String, default: "", index: true },
    status: { type: String, default: "draft" },
    documentData: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: String, default: "" },
    updatedAt: { type: String, default: "" },
    createdById: { type: String, default: "" },
    createdByName: { type: String, default: "" },
    updatedById: { type: String, default: "" },
    updatedByName: { type: String, default: "" }
  },
  {
    collection: "announcements",
    versionKey: false
  }
);

export const AnnouncementDbModel: any =
  mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

