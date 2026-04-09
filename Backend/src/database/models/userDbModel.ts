import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    allowedSections: { type: [String], default: [] },
    passwordHash: { type: String, required: true },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: String, default: null },
    lastLoginAt: { type: String, default: null },
    passwordResetTokenHash: { type: String, default: "" },
    passwordResetExpiresAt: { type: String, default: "" },
    refreshTokenHashes: { type: [String], default: [] },
    createdAt: { type: String, required: true }
  },
  {
    collection: "users",
    versionKey: false
  }
);

export const UserDbModel: any = mongoose.models.User || mongoose.model("User", userSchema);

