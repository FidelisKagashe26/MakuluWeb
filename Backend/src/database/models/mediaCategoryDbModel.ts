import mongoose, { Schema } from "mongoose";

const mediaCategorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ["image", "video"], index: true },
    name: { type: String, required: true, trim: true, index: true },
    createdAt: { type: String, required: true, index: true },
    updatedAt: { type: String, required: true }
  },
  {
    collection: "media_categories",
    versionKey: false
  }
);

export const MediaCategoryDbModel: any =
  mongoose.models.MediaCategory || mongoose.model("MediaCategory", mediaCategorySchema);

