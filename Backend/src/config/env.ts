import path from "node:path";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "10m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "10m";
const DEFAULT_FRONTEND_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function normalizeOrigin(origin: string) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

function parseFrontendOrigins() {
  const rawOrigins =
    process.env.FRONTEND_URLS || process.env.FRONTEND_URL || DEFAULT_FRONTEND_ORIGINS.join(",");
  const entries = String(rawOrigins)
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

  if (entries.length === 0) {
    return DEFAULT_FRONTEND_ORIGINS;
  }

  return Array.from(new Set(entries));
}

const frontendOrigins = parseFrontendOrigins();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5001),
  frontendUrl: frontendOrigins[0],
  frontendOrigins,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  mongoDbName: process.env.MONGODB_DB_NAME || "makulu_church",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "replace-this-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "replace-this-refresh-secret",
  jwtAccessExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
  jwtRefreshExpiresIn: REFRESH_TOKEN_EXPIRES_IN,
  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS || 5),
  lockMinutes: Number(process.env.ACCOUNT_LOCK_MINUTES || 15),
  uploadsDir: process.env.UPLOADS_DIR || path.resolve(process.cwd(), "uploads"),
  apiCacheTtlMs: Number(process.env.API_CACHE_TTL_MS || 30000)
};
