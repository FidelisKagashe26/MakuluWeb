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

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const reportMimeTypes = [...imageMimeTypes, "application/pdf"];
const documentMimeTypes = ["application/pdf"];

function buildUpload(allowedMimes, maxFileSize = 8 * 1024 * 1024) {
  return multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Aina ya file hairuhusiwi."));
      }
    }
  });
}

export const uploadImage = buildUpload(imageMimeTypes).single("image");
export const uploadReportFiles = buildUpload(reportMimeTypes).array("attachments", 5);
export const uploadDocument = buildUpload(documentMimeTypes, 25 * 1024 * 1024).single("document");
