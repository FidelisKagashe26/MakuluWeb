import mongoose, { Schema } from "mongoose";

const leaderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    biography: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    order: { type: Number, default: 1, index: true }
  },
  {
    collection: "leaders",
    versionKey: false
  }
);

export const LeaderDbModel: any = mongoose.models.Leader || mongoose.model("Leader", leaderSchema);

