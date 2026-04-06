import "dotenv/config";
import express from "express";
import path from "node:path";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimitMiddleware.js";
import { sanitizeRequest } from "./middleware/sanitizeMiddleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { connectMongoDatabase } from "./database/mongo.js";

const app = express();
const uploadsPath = path.resolve(env.uploadsDir);
const allowedOrigins = new Set(env.frontendOrigins.map((origin) => String(origin || "").replace(/\/+$/, "")));

function isLocalDevOrigin(origin: string) {
  if (env.nodeEnv === "production") return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalized = String(origin).replace(/\/+$/, "");
    if (allowedOrigins.has(normalized) || isLocalDevOrigin(normalized)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
};

app.use(cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan("dev"));
app.use(apiLimiter);
app.use(sanitizeRequest);

app.use(
  "/uploads",
  (_req, res, next) => {
    // Helps verify reverse-proxy routing during deployment smoke checks.
    res.setHeader("X-Makulu-Uploads", "backend");
    next();
  },
  express.static(uploadsPath)
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "DODOMA MAKULU SDA CHURCH API",
    env: env.nodeEnv,
    time: new Date().toISOString(),
    docs: {
      auth: "/api/auth/login",
      admin: "/api/admin/dashboard",
      public: "/api/public/site-settings"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await connectMongoDatabase();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`CORS allowed origins: ${Array.from(allowedOrigins).join(", ")}`);
  });
}

void startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API:", error);
  process.exit(1);
});
