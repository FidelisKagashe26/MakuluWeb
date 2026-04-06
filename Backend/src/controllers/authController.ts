import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import {
  addRefreshTokenHash,
  findUserByEmail,
  findUserById,
  isUserLocked,
  registerFailedAttempt,
  removeRefreshTokenHash,
  resetFailedAttempts,
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

export async function login(req: Request, res: Response) {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email na password vinahitajika." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ ok: false, message: "Taarifa za kuingia si sahihi." });
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({ ok: false, message: "Akaunti imezimwa." });
    }

    if (isUserLocked(user)) {
      const lockedUntil = new Date(String(user.lockedUntil));
      const remainingMs = Math.max(lockedUntil.getTime() - Date.now(), 0);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return res.status(423).json({
        ok: false,
        message: "Akaunti imefungwa kwa muda baada ya majaribio mengi.",
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
          message: `Majaribio ${env.maxLoginAttempts} yameshindwa. Subiri dakika ${env.lockMinutes} kabla ya kujaribu tena.`,
          remainingAttempts: 0,
          lockedUntil,
          retryAfterSeconds: remainingSeconds
        });
      }

      return res.status(401).json({
        ok: false,
        message: "Taarifa za kuingia si sahihi.",
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
      message: "Umeingia kikamilifu.",
      data: {
        user: toSafeUser(userAfterLogin),
        accessToken,
        refreshToken
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function refreshToken(req: Request, res: Response) {
  const token = String(req.body?.refreshToken || req.cookies?.refreshToken || "");
  if (!token) {
    return res.status(401).json({ ok: false, message: "Refresh token haijatumwa." });
  }

  try {
    const decoded = verifyRefreshToken(token) as { sub: string };
    const user = await findUserById(decoded.sub);

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      return res.status(401).json({ ok: false, message: "Mtumiaji si halali." });
    }

    const tokenHash = hashToken(token);
    if (!user.refreshTokenHashes.includes(tokenHash)) {
      return res.status(401).json({ ok: false, message: "Refresh token haipo au imeondolewa." });
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
    return res.status(401).json({ ok: false, message: "Refresh token si sahihi au ime-expire." });
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
  return res.json({ ok: true, message: "Umetoka kikamilifu." });
}

export async function me(req: Request, res: Response) {
  const authId = req.auth?.id;
  if (!authId) {
    return res.status(401).json({ ok: false, message: "Hujaingia." });
  }

  try {
    const user = await findUserById(authId);
    if (!user) {
      return res.status(401).json({ ok: false, message: "Mtumiaji hayupo." });
    }

    return res.json({ ok: true, data: toSafeUser(user) });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
