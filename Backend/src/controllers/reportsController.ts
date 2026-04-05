import fs from "node:fs";
import type { Request, Response } from "express";
import {
  createReport,
  deleteReport,
  findReportById,
  listReports,
  updateReport
} from "../models/reportsModel.js";
import { paginate } from "../utils/pagination.js";
import { generateId } from "../utils/id.js";
import { findDepartmentById } from "../models/departmentsModel.js";

function normalizeAttachment(file: any) {
  return {
    id: generateId("att"),
    originalName: file.originalname,
    fileName: file.filename,
    path: file.path,
    mimeType: file.mimetype,
    size: file.size
  };
}

export async function getReports(req: Request, res: Response) {
  try {
    const departmentId = String(req.query.departmentId || "");
    const search = String(req.query.search || "").toLowerCase();
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const reports = await listReports();
    const filtered = reports.filter((report) => {
      if (departmentId && report.departmentId !== departmentId) return false;
      if (!search) return true;
      return report.title.toLowerCase().includes(search) || report.content.toLowerCase().includes(search);
    });

    const { items, meta } = paginate(filtered, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createReportHandler(req: Request, res: Response) {
  const { departmentId, title, content, author, reportDate } = req.body || {};

  if (!departmentId || !title) {
    return res.status(400).json({ ok: false, message: "departmentId na title vinahitajika." });
  }

  try {
    const department = await findDepartmentById(departmentId);
    if (!department) {
      return res.status(404).json({ ok: false, message: "Idara haijapatikana." });
    }

    const files = (req.files as any[]) || [];
    const attachments = files.map(normalizeAttachment);

    const report = await createReport({
      departmentId,
      title,
      content,
      author,
      reportDate,
      attachments
    });

    return res.status(201).json({ ok: true, data: report });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateReportHandler(req: Request, res: Response) {
  try {
    const report = await findReportById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ ok: false, message: "Report haijapatikana." });
    }

    const files = (req.files as any[]) || [];
    const attachments = [...(report.attachments || []), ...files.map(normalizeAttachment)];

    const updated = await updateReport(report.id, {
      ...req.body,
      attachments
    });

    return res.json({ ok: true, data: updated });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteReportHandler(req: Request, res: Response) {
  try {
    const report = await findReportById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ ok: false, message: "Report haijapatikana." });
    }

    for (const attachment of report.attachments || []) {
      try {
        if (attachment.path && fs.existsSync(attachment.path)) {
          fs.unlinkSync(attachment.path);
        }
      } catch {
        // ignore file deletion errors
      }
    }

    await deleteReport(report.id);
    return res.json({ ok: true, message: "Report imefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function downloadReportAttachment(req: Request, res: Response) {
  try {
    const report = await findReportById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ ok: false, message: "Report haijapatikana." });
    }

    const attachment = (report.attachments || []).find(
      (item: any) => item.id === req.params.attachmentId
    );
    if (!attachment || !attachment.path || !fs.existsSync(attachment.path)) {
      return res.status(404).json({ ok: false, message: "Attachment haijapatikana." });
    }

    return res.download(attachment.path, attachment.originalName || attachment.fileName);
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
