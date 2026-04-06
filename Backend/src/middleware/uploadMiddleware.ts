import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

fs.mkdirSync(env.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replaceAll(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    cb(null, `${Date.now()}_${safeBase}${path.extname(file.originalname)}`);
  }
});

const imageMimeTypes = ["image/*"];
const reportMimeTypes = [...imageMimeTypes, "application/pdf"];
const documentMimeTypes = ["application/pdf"];
const configuredImageUploadMb = Number(process.env.MAX_IMAGE_UPLOAD_MB || 0);
const imageUploadMaxBytes =
  Number.isFinite(configuredImageUploadMb) && configuredImageUploadMb > 0
    ? configuredImageUploadMb * 1024 * 1024
    : undefined;

function allowsMimeType(allowedMimes: string[], mimeType: string) {
  return allowedMimes.some((rule) => {
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, rule.indexOf("/"));
      return mimeType.startsWith(`${prefix}/`);
    }
    return rule === mimeType;
  });
}

function buildUpload(allowedMimes: string[], maxFileSize?: number) {
  const limits = Number.isFinite(maxFileSize as number)
    ? { fileSize: Number(maxFileSize) }
    : undefined;

  return multer({
    storage,
    limits,
    fileFilter: (_req, file, cb) => {
      if (allowsMimeType(allowedMimes, String(file.mimetype || ""))) {
        cb(null, true);
      } else {
        cb(new Error("Aina ya file hairuhusiwi."));
      }
    }
  });
}

export const uploadImage = buildUpload(imageMimeTypes, imageUploadMaxBytes).single("image");
export const uploadReportFiles = buildUpload(reportMimeTypes, 25 * 1024 * 1024).array("attachments", 5);
export const uploadDocument = buildUpload(documentMimeTypes, 25 * 1024 * 1024).single("document");
