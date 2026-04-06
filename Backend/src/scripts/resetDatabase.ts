import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { defaultSiteSettings } from "../data/defaultSiteSettings.js";
import { UserDbModel } from "../database/models/userDbModel.js";
import { SiteSettingsDbModel } from "../database/models/siteSettingsDbModel.js";
import { DepartmentDbModel } from "../database/models/departmentDbModel.js";
import { LeaderDbModel } from "../database/models/leaderDbModel.js";
import { GroupDbModel } from "../database/models/groupDbModel.js";
import { ReportDbModel } from "../database/models/reportDbModel.js";
import { AnnouncementDbModel } from "../database/models/announcementDbModel.js";
import { ActivityDbModel } from "../database/models/activityDbModel.js";
import { generateId } from "../utils/id.js";
import { ROLES, USER_STATUS } from "../utils/constants.js";
import { getDefaultSectionsForRole } from "../services/rbacService.js";

async function resetDatabase() {
  await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });

  await Promise.all([
    ActivityDbModel.deleteMany({}),
    AnnouncementDbModel.deleteMany({}),
    DepartmentDbModel.deleteMany({}),
    GroupDbModel.deleteMany({}),
    LeaderDbModel.deleteMany({}),
    ReportDbModel.deleteMany({}),
    SiteSettingsDbModel.deleteMany({}),
    UserDbModel.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash("Admin@123", 10);
  const now = new Date().toISOString();

  await UserDbModel.insertMany([
    {
      id: generateId("usr"),
      email: "superadmin@makulu.org",
      fullName: "Super Admin",
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      allowedSections: getDefaultSectionsForRole(ROLES.SUPER_ADMIN),
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
      allowedSections: getDefaultSectionsForRole(ROLES.ADMIN),
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
      allowedSections: getDefaultSectionsForRole(ROLES.EDITOR),
      passwordHash,
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      refreshTokenHashes: [],
      createdAt: now
    }
  ]);

  await SiteSettingsDbModel.create({
    key: "main",
    ...defaultSiteSettings
  });

  // eslint-disable-next-line no-console
  console.log(`Database reset complete for "${env.mongoDbName}".`);
}

void resetDatabase()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to reset database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
