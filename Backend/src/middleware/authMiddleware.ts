import { findUserById } from "../models/userModel.js";
import { USER_STATUS } from "../utils/constants.js";
import { verifyAccessToken } from "../services/tokenService.js";

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function authenticate(req, res, next) {
  const token = getBearerToken(req) || req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ ok: false, message: "Token haijatumwa." });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await findUserById(decoded.sub);

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      return res.status(401).json({ ok: false, message: "Mtumiaji si halali." });
    }

    req.auth = {
      id: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    };

    return next();
  } catch {
    return res.status(401).json({ ok: false, message: "Token si sahihi au ime-expire." });
  }
}
