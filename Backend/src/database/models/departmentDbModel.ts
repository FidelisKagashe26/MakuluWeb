import mongoose, { Schema } from "mongoose";

const committeeMemberSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" }
  },
  { _id: false }
);

const departmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    createdAt: { type: String, required: true },
    committee: { type: [committeeMemberSchema], default: [] }
  },
  {
    collection: "departments",
    versionKey: false
  }
);

export const DepartmentDbModel: any =
  mongoose.models.Department || mongoose.model("Department", departmentSchema);

