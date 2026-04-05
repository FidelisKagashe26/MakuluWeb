import type { Request, Response } from "express";

export function uploadImageHandler(req: Request, res: Response) {
  const file = req.file as any;
  if (!file) {
    return res.status(400).json({ ok: false, message: "Image haijatumwa." });
  }

  return res.status(201).json({
    ok: true,
    data: {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`
    }
  });
}

export function uploadDocumentHandler(req: Request, res: Response) {
  const file = req.file as any;
  if (!file) {
    return res.status(400).json({ ok: false, message: "PDF haijatumwa." });
  }

  return res.status(201).json({
    ok: true,
    data: {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`
    }
  });
}
