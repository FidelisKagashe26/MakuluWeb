import mongoose, { Schema } from "mongoose";

const mediaSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, enum: ["image", "video"], index: true },
    mediaCategoryId: { type: String, default: "", index: true },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    createdAt: { type: String, required: true, index: true },
    updatedAt: { type: String, required: true }
  },
  {
    collection: "media",
    versionKey: false
  }
);

export const MediaDbModel: any = mongoose.models.Media || mongoose.model("Media", mediaSchema);
