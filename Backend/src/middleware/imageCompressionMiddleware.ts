import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { NextFunction, Request, Response } from "express";

const MAX_COMPRESSED_IMAGE_BYTES = 500 * 1024;
const QUALITY_STEPS = [82, 74, 66, 58, 50, 42, 35, 28];
const SCALE_STEPS = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
const MIN_WIDTH = 260;

async function buildCompressedWebpBuffer(inputPath: string) {
  const metadata = await sharp(inputPath, { failOn: "none" }).metadata();
  const baseWidth = Number(metadata.width) > 0 ? Number(metadata.width) : null;

  let bestAttempt: Buffer | null = null;

  for (const scale of SCALE_STEPS) {
    const width = baseWidth
      ? Math.max(MIN_WIDTH, Math.round(baseWidth * scale))
      : undefined;

    for (const quality of QUALITY_STEPS) {
      const compressed = await sharp(inputPath, { failOn: "none" })
        .rotate()
        .resize(width ? { width, withoutEnlargement: true } : undefined)
        .webp({ quality, effort: 6 })
        .toBuffer();

      bestAttempt = compressed;
      if (compressed.byteLength <= MAX_COMPRESSED_IMAGE_BYTES) {
        return compressed;
      }
    }
  }

  if (bestAttempt && bestAttempt.byteLength <= MAX_COMPRESSED_IMAGE_BYTES) {
    return bestAttempt;
  }

  const finalAttempt = await sharp(inputPath, { failOn: "none" })
    .rotate()
    .resize({ width: MIN_WIDTH, withoutEnlargement: true })
    .webp({ quality: 22, effort: 6 })
    .toBuffer();

  if (finalAttempt.byteLength > MAX_COMPRESSED_IMAGE_BYTES) {
    throw new Error("Imeshindikana kukandamiza picha hadi chini ya 500KB.");
  }

  return finalAttempt;
}

export async function compressUploadedImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      next();
      return;
    }

    const mimeType = String(file.mimetype || "").toLowerCase();
    if (!mimeType.startsWith("image/")) {
      next();
      return;
    }

    const compressedBuffer = await buildCompressedWebpBuffer(file.path);

    const parsed = path.parse(file.filename);
    const compressedFileName = `${parsed.name}.webp`;
    const compressedPath = path.join(path.dirname(file.path), compressedFileName);

    await fs.writeFile(compressedPath, compressedBuffer);
    if (compressedPath !== file.path) {
      await fs.unlink(file.path).catch(() => undefined);
    }

    req.file = {
      ...file,
      filename: compressedFileName,
      path: compressedPath,
      mimetype: "image/webp",
      size: compressedBuffer.byteLength
    } as Express.Multer.File;

    next();
  } catch (error) {
    res.status(400).json({
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Imeshindikana kuchakata picha. Jaribu picha nyingine."
    });
  }
}
