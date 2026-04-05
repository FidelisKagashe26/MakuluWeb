import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";

function basePayload(user) {
  return {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.fullName
  };
}

export function signAccessToken(user) {
  const expiresIn = env.jwtAccessExpiresIn as jwt.SignOptions["expiresIn"];
  return jwt.sign(basePayload(user), env.jwtAccessSecret, {
    expiresIn
  });
}

export function signRefreshToken(user) {
  const expiresIn = env.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"];
  return jwt.sign(basePayload(user), env.jwtRefreshSecret, {
    expiresIn
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
