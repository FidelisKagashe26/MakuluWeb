import { generateId } from "../utils/id.js";
import { USER_STATUS } from "../utils/constants.js";
import { UserDbModel } from "../database/models/userDbModel.js";

export async function listUsers() {
  return UserDbModel.find().sort({ createdAt: -1 }).lean();
}

export async function findUserByEmail(email) {
  return UserDbModel.findOne({ email: String(email).toLowerCase() }).lean();
}

export async function findUserById(userId) {
  return UserDbModel.findOne({ id: userId }).lean();
}

export async function createUser({ email, fullName, role, passwordHash, status = USER_STATUS.ACTIVE }) {
  const user = {
    id: generateId("usr"),
    email: String(email).toLowerCase(),
    fullName,
    role,
    status,
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

  const updated = await UserDbModel.findOneAndUpdate(
    { id: userId },
    { $set: nextUpdates },
    { returnDocument: "after" }
  ).lean();

  return updated;
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
  const failedAttempts = Number(user?.failedAttempts || 0) + 1;
  const updates: any = { failedAttempts };

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

