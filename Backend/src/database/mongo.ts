import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { defaultSiteSettings } from "../data/defaultSiteSettings.js";
import { generateId } from "../utils/id.js";
import { ROLES, USER_STATUS } from "../utils/constants.js";
import { SiteSettingsDbModel } from "./models/siteSettingsDbModel.js";
import { UserDbModel } from "./models/userDbModel.js";

const DEFAULT_PASSWORD = "Admin@123";
let connected = false;

export async function connectMongoDatabase() {
  if (connected) return;

  await mongoose.connect(env.mongoUri, {
    dbName: env.mongoDbName
  });

  connected = true;
  await seedCoreData();
}

async function seedCoreData() {
  const usersCount = await UserDbModel.estimatedDocumentCount();
  if (usersCount === 0) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const now = new Date().toISOString();

    await UserDbModel.insertMany([
      {
        id: generateId("usr"),
        email: "superadmin@makulu.org",
        fullName: "Super Admin",
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE,
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        refreshTokenHashes: [],
        createdAt: now
      },
      {
        id: generateId("usr"),
        email: "admin@makulu.org",
        fullName: "Admin User",
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        refreshTokenHashes: [],
        createdAt: now
      },
      {
        id: generateId("usr"),
        email: "editor@makulu.org",
        fullName: "Editor User",
        role: ROLES.EDITOR,
        status: USER_STATUS.ACTIVE,
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        refreshTokenHashes: [],
        createdAt: now
      }
    ]);
  }

  const settingsExists = await SiteSettingsDbModel.exists({ key: "main" });
  if (!settingsExists) {
    await SiteSettingsDbModel.create({
      key: "main",
      ...defaultSiteSettings
    });
  }
}
