import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    summary: { type: String, default: "" },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    category: { type: String, default: "", index: true },
    actionLabel: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false, index: true },
    location: { type: String, default: "" },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String, required: true, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    createdAt: { type: String, default: "" },
    updatedAt: { type: String, default: "" },
    createdById: { type: String, default: "" },
    createdByName: { type: String, default: "" },
    updatedById: { type: String, default: "" },
    updatedByName: { type: String, default: "" }
  },
  {
    collection: "events",
    versionKey: false
  }
);

export const EventDbModel: any = mongoose.models.Event || mongoose.model("Event", eventSchema);
