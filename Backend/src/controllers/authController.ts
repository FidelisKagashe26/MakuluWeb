import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import {
  addRefreshTokenHash,
  clearPasswordResetToken,
  clearRefreshTokenHashes,
  findUserByPasswordResetTokenHash,
  findUserByEmail,
  findUserById,
  isUserLocked,
  registerFailedAttempt,
  removeRefreshTokenHash,
  resetFailedAttempts,
  setPasswordResetToken,
  updateUser
} from "../models/userModel.js";
import { getPermissionsForRole, normalizeAllowedSections } from "../services/rbacService.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../services/tokenService.js";
import { USER_STATUS } from "../utils/constants.js";
import { addActivity } from "../services/activityService.js";
import { sendPasswordResetEmail } from "../services/mailService.js";

function toSafeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    allowedSections: normalizeAllowedSections(user.role, user.allowedSections),
    permissions: getPermissionsForRole(user.role)
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = env.nodeEnv === "production";
  const sessionMs = 15 * 60 * 1000;
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: sessionMs
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: sessionMs
  });
}

function buildPasswordResetUrl(token: string) {
  const base = String(env.passwordResetUrlBase || "").trim();

  try {
    const url = new URL(base || `${env.frontendUrl}/admin/login`);
    url.searchParams.set("mode", "reset");
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    const fallbackBase = base || `${env.frontendUrl || "http://localhost:5173"}/admin/login`;
    const separator = fallbackBase.includes("?") ? "&" : "?";
    return `${fallbackBase}${separator}mode=reset&token=${encodeURIComponent(token)}`;
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email and password are required." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid login credentials." });
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({ ok: false, message: "Account is disabled." });
    }

    if (isUserLocked(user)) {
      const lockedUntil = new Date(String(user.lockedUntil));
      const remainingMs = Math.max(lockedUntil.getTime() - Date.now(), 0);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return res.status(423).json({
        ok: false,
        message: "Account is temporarily locked due to too many attempts.",
        lockedUntil: user.lockedUntil,
        retryAfterSeconds: remainingSeconds
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      const attempted = await registerFailedAttempt(user, env.maxLoginAttempts, env.lockMinutes);
      const failedAttempts = Number(attempted?.failedAttempts || user.failedAttempts || 0);
      const lockedUntil = attempted?.lockedUntil || user.lockedUntil;
      const isLockedNow = Boolean(lockedUntil) && new Date(String(lockedUntil)).getTime() > Date.now();

      if (isLockedNow) {
        const remainingMs = Math.max(new Date(String(lockedUntil)).getTime() - Date.now(), 0);
        const remainingSeconds = Math.ceil(remainingMs / 1000);

        return res.status(423).json({
          ok: false,
          message: `Too many failed attempts (${env.maxLoginAttempts}). Please wait ${env.lockMinutes} minutes before retrying.`,
          remainingAttempts: 0,
          lockedUntil,
          retryAfterSeconds: remainingSeconds
        });
      }

      return res.status(401).json({
        ok: false,
        message: "Invalid login credentials.",
        remainingAttempts: Math.max(env.maxLoginAttempts - failedAttempts, 0)
      });
    }

    await resetFailedAttempts(user);
    const userAfterLogin =
      (await updateUser(user.id, { lastLoginAt: new Date().toISOString() })) || user;

    const accessToken = signAccessToken(userAfterLogin);
    const refreshToken = signRefreshToken(userAfterLogin);
    await addRefreshTokenHash(userAfterLogin, hashToken(refreshToken));

    setAuthCookies(res, accessToken, refreshToken);

    addActivity({
      userId: userAfterLogin.id,
      userName: userAfterLogin.fullName,
      action: "LOGIN",
      entity: "AUTH",
      entityId: userAfterLogin.id,
      detail: "User logged in"
    });

    return res.json({
      ok: true,
      message: "Logged in successfully.",
      data: {
        user: toSafeUser(userAfterLogin),
        accessToken,
        refreshToken
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error." });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ ok: false, message: "Email is required." });
  }

  try {
    const user = await findUserByEmail(email);
    if (user && user.status === USER_STATUS.ACTIVE) {
      const rawToken = randomBytes(32).toString("hex");
      const resetTokenHash = hashToken(rawToken);
      const expiresAt = new Date(
        Date.now() + env.passwordResetTokenExpiresMinutes * 60 * 1000
      ).toISOString();

      await setPasswordResetToken(user.id, resetTokenHash, expiresAt);

      try {
        await sendPasswordResetEmail({
          toEmail: user.email,
          fullName: user.fullName,
          resetUrl: buildPasswordResetUrl(rawToken),
          expiresMinutes: env.passwordResetTokenExpiresMinutes
        });
      } catch (mailError) {
        await clearPasswordResetToken(user.id);
        // eslint-disable-next-line no-console
        console.error("Failed to send password reset email:", mailError);
        return res.status(500).json({
          ok: false,
          message: "Failed to send password reset email. Please try again."
        });
      }
    }

    return res.json({
      ok: true,
      message: "If the email exists, reset instructions have been sent."
    });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error." });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.newPassword || "");

  if (!token || !newPassword) {
    return res.status(400).json({ ok: false, message: "Token and new password are required." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      ok: false,
      message: "New password must be at least 8 characters."
    });
  }

  try {
    const resetTokenHash = hashToken(token);
    const user = await findUserByPasswordResetTokenHash(resetTokenHash);
    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Token is invalid or expired. Request a new reset link."
      });
    }

    const nextPasswordHash = await bcrypt.hash(newPassword, 10);
    const updatedUser =
      (await updateUser(user.id, {
        passwordHash: nextPasswordHash,
        failedAttempts: 0,
        lockedUntil: null,
        passwordResetTokenHash: "",
        passwordResetExpiresAt: ""
      })) || user;

    await clearRefreshTokenHashes(updatedUser);

    addActivity({
      userId: updatedUser.id,
      userName: updatedUser.fullName,
      action: "RESET_PASSWORD",
      entity: "AUTH",
      entityId: updatedUser.id,
      detail: "User reset password via email link"
    });

    return res.json({ ok: true, message: "Password reset successfully. Please sign in again." });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error." });
  }
}

export async function refreshToken(req: Request, res: Response) {
  const token = String(req.body?.refreshToken || req.cookies?.refreshToken || "");
  if (!token) {
    return res.status(401).json({ ok: false, message: "Refresh token is required." });
  }

  try {
    const decoded = verifyRefreshToken(token) as { sub: string };
    const user = await findUserById(decoded.sub);

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      return res.status(401).json({ ok: false, message: "User is not valid." });
    }

    const tokenHash = hashToken(token);
    if (!user.refreshTokenHashes.includes(tokenHash)) {
      return res.status(401).json({ ok: false, message: "Refresh token is missing or revoked." });
    }

    await removeRefreshTokenHash(user, tokenHash);
    const nextAccessToken = signAccessToken(user);
    const nextRefreshToken = signRefreshToken(user);
    await addRefreshTokenHash(user, hashToken(nextRefreshToken));

    setAuthCookies(res, nextAccessToken, nextRefreshToken);

    return res.json({
      ok: true,
      data: {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
        user: toSafeUser(user)
      }
    });
  } catch {
    return res.status(401).json({ ok: false, message: "Refresh token is invalid or expired." });
  }
}

export async function logout(req: Request, res: Response) {
  const refreshToken = String(req.body?.refreshToken || req.cookies?.refreshToken || "");

  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken) as { sub: string };
      const user = await findUserById(decoded.sub);
      if (user) {
        await removeRefreshTokenHash(user, hashToken(refreshToken));
      }
    } catch {
      // Ignore invalid token on logout.
    }
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.json({ ok: true, message: "Logged out successfully." });
}

export async function me(req: Request, res: Response) {
  const authId = req.auth?.id;
  if (!authId) {
    return res.status(401).json({ ok: false, message: "Not authenticated." });
  }

  try {
    const user = await findUserById(authId);
    if (!user) {
      return res.status(401).json({ ok: false, message: "User not found." });
    }

    return res.json({ ok: true, data: toSafeUser(user) });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error." });
  }
}
