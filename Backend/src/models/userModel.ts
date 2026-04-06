import { generateId } from "../utils/id.js";
import { USER_STATUS } from "../utils/constants.js";
import { UserDbModel } from "../database/models/userDbModel.js";
import { normalizeAllowedSections } from "../services/rbacService.js";

export async function listUsers() {
  const users = await UserDbModel.find().sort({ createdAt: -1 }).lean();
  return users.map((user: any) => ({
    ...user,
    allowedSections: normalizeAllowedSections(user?.role, user?.allowedSections)
  }));
}

export async function findUserByEmail(email) {
  const user = await UserDbModel.findOne({ email: String(email).toLowerCase() }).lean();
  if (!user) return null;

  return {
    ...user,
    allowedSections: normalizeAllowedSections(user?.role, user?.allowedSections)
  };
}

export async function findUserById(userId) {
  const user = await UserDbModel.findOne({ id: userId }).lean();
  if (!user) return null;

  return {
    ...user,
    allowedSections: normalizeAllowedSections(user?.role, user?.allowedSections)
  };
}

export async function createUser({
  email,
  fullName,
  role,
  passwordHash,
  status = USER_STATUS.ACTIVE,
  allowedSections
}) {
  const normalizedAllowedSections = normalizeAllowedSections(role, allowedSections);
  const user = {
    id: generateId("usr"),
    email: String(email).toLowerCase(),
    fullName,
    role,
    status,
    allowedSections: normalizedAllowedSections,
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    refreshTokenHashes: [],
    createdAt: new Date().toISOString()
  };

  await UserDbModel.create(user);
  return user;
}

export async function updateUser(userId, updates) {
  const nextUpdates = { ...updates };
  if (nextUpdates?.email) {
    nextUpdates.email = String(nextUpdates.email).toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(nextUpdates, "allowedSections")) {
    const nextRole = String(nextUpdates.role || "").trim();
    if (nextRole) {
      nextUpdates.allowedSections = normalizeAllowedSections(nextRole, nextUpdates.allowedSections);
    } else {
      const current = await UserDbModel.findOne({ id: userId }).lean();
      const role = current?.role;
      nextUpdates.allowedSections = normalizeAllowedSections(role, nextUpdates.allowedSections);
    }
  } else if (Object.prototype.hasOwnProperty.call(nextUpdates, "role")) {
    const current = await UserDbModel.findOne({ id: userId }).lean();
    nextUpdates.allowedSections = normalizeAllowedSections(nextUpdates.role, current?.allowedSections);
  }

  const updated = await UserDbModel.findOneAndUpdate(
    { id: userId },
    { $set: nextUpdates },
    { returnDocument: "after" }
  ).lean();

  if (!updated) return null;

  return {
    ...updated,
    allowedSections: normalizeAllowedSections(updated?.role, updated?.allowedSections)
  };
}

export async function deleteUser(userId) {
  const result = await UserDbModel.deleteOne({ id: userId });
  return result.deletedCount > 0;
}

export function isUserLocked(user) {
  if (!user?.lockedUntil) return false;
  return new Date(user.lockedUntil).getTime() > Date.now();
}

export async function registerFailedAttempt(user, maxAttempts, lockMinutes) {
  const lockExpired =
    Boolean(user?.lockedUntil) && new Date(String(user.lockedUntil)).getTime() <= Date.now();
  const baseFailedAttempts = lockExpired ? 0 : Number(user?.failedAttempts || 0);
  const failedAttempts = baseFailedAttempts + 1;
  const updates: any = { failedAttempts };

  if (lockExpired) {
    updates.lockedUntil = null;
  }

  if (failedAttempts >= maxAttempts) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + lockMinutes);
    updates.lockedUntil = lockedUntil.toISOString();
  }

  return updateUser(user.id, updates);
}

export async function resetFailedAttempts(user) {
  return updateUser(user.id, {
    failedAttempts: 0,
    lockedUntil: null
  });
}

export async function addRefreshTokenHash(user, tokenHash) {
  await UserDbModel.updateOne(
    { id: user.id },
    {
      $addToSet: { refreshTokenHashes: tokenHash }
    }
  );
}

export async function removeRefreshTokenHash(user, tokenHash) {
  await UserDbModel.updateOne(
    { id: user.id },
    {
      $pull: { refreshTokenHashes: tokenHash }
    }
  );
}

export async function clearRefreshTokenHashes(user) {
  await UserDbModel.updateOne(
    { id: user.id },
    {
      $set: { refreshTokenHashes: [] }
    }
  );
}

