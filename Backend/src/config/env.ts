import path from "node:path";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "15m";
const DEFAULT_FRONTEND_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function normalizeOrigin(origin: string) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
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
  lockMinutes: Number(process.env.ACCOUNT_LOCK_MINUTES || 2),
  passwordResetTokenExpiresMinutes: Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES || 30),
  passwordResetUrlBase:
    String(process.env.PASSWORD_RESET_URL_BASE || "").trim() ||
    `${frontendOrigins[0] || "http://localhost:5173"}/admin/login`,
  smtpHost: String(process.env.SMTP_HOST || "").trim(),
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
  smtpUser: String(process.env.SMTP_USER || "").trim(),
  smtpPass: String(process.env.SMTP_PASS || "").trim(),
  smtpFromName: String(process.env.SMTP_FROM_NAME || "Makulu Admin").trim(),
  smtpFromEmail: String(process.env.SMTP_FROM_EMAIL || "").trim(),
  uploadsDir: process.env.UPLOADS_DIR || path.resolve(process.cwd(), "uploads"),
  apiCacheTtlMs: Number(process.env.API_CACHE_TTL_MS || 30000)
};
