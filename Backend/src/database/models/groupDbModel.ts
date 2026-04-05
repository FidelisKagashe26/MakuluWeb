import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    youtubeLink: { type: String, default: "" },
    type: { type: String, default: "Kikundi" }
  },
  {
    collection: "groups",
    versionKey: false
  }
);

export const GroupDbModel: any = mongoose.models.Group || mongoose.model("Group", groupSchema);

