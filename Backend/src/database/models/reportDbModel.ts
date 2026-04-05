import mongoose, { Schema } from "mongoose";

const attachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    originalName: { type: String, default: "" },
    fileName: { type: String, default: "" },
    path: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 }
  },
  { _id: false }
);

const reportSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    departmentId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    content: { type: String, default: "" },
    reportDate: { type: String, required: true, index: true },
    author: { type: String, default: "" },
    attachments: { type: [attachmentSchema], default: [] }
  },
  {
    collection: "reports",
    versionKey: false
  }
);

export const ReportDbModel: any = mongoose.models.Report || mongoose.model("Report", reportSchema);

