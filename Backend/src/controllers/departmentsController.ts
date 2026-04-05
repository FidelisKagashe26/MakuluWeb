import type { Request, Response } from "express";
import {
  addCommitteeMember,
  createDepartment,
  deleteCommitteeMember,
  deleteDepartment,
  findDepartmentById,
  listDepartments,
  updateCommitteeMember,
  updateDepartment
} from "../models/departmentsModel.js";
import { addActivity } from "../services/activityService.js";
import { paginate } from "../utils/pagination.js";
import {
  createReport,
  deleteReport,
  listReports,
  updateReport
} from "../models/reportsModel.js";

export async function getDepartments(req: Request, res: Response) {
  try {
    const search = String(req.query.search || "").toLowerCase();
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 9);

    const departments = await listDepartments();
    const filtered = departments.filter((item) => {
      if (!search) return true;
      return (
        item.name.toLowerCase().includes(search) || item.description.toLowerCase().includes(search)
      );
    });

    const { items, meta } = paginate(filtered, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function getDepartmentDetail(req: Request, res: Response) {
  try {
    const department = await findDepartmentById(req.params.departmentId);
    if (!department) {
      return res.status(404).json({ ok: false, message: "Idara haijapatikana." });
    }

    const reports = (await listReports()).filter((report) => report.departmentId === department.id);
    return res.json({ ok: true, data: { ...department, reports } });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createDepartmentHandler(req: Request, res: Response) {
  const { name, description, imageUrl } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, message: "Jina la idara linahitajika." });
  }

  try {
    const created = await createDepartment({ name, description, imageUrl });

    addActivity({
      userId: req.auth?.id,
      userName: req.auth?.fullName,
      action: "CREATE",
      entity: "DEPARTMENT",
      entityId: created.id,
      detail: `Created department ${created.name}`
    });

    return res.status(201).json({ ok: true, data: created });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateDepartmentHandler(req: Request, res: Response) {
  try {
    const updated = await updateDepartment(req.params.departmentId, req.body || {});
    if (!updated) {
      return res.status(404).json({ ok: false, message: "Idara haijapatikana." });
    }

    addActivity({
      userId: req.auth?.id,
      userName: req.auth?.fullName,
      action: "UPDATE",
      entity: "DEPARTMENT",
      entityId: updated.id,
      detail: `Updated department ${updated.name}`
    });

    return res.json({ ok: true, data: updated });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteDepartmentHandler(req: Request, res: Response) {
  try {
    const success = await deleteDepartment(req.params.departmentId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Idara haijapatikana." });
    }

    addActivity({
      userId: req.auth?.id,
      userName: req.auth?.fullName,
      action: "DELETE",
      entity: "DEPARTMENT",
      entityId: req.params.departmentId,
      detail: "Deleted department"
    });

    return res.json({ ok: true, message: "Idara imefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createCommitteeMemberHandler(req: Request, res: Response) {
  try {
    const member = await addCommitteeMember(req.params.departmentId, req.body || {});
    if (!member) {
      return res.status(404).json({ ok: false, message: "Idara haijapatikana." });
    }
    return res.status(201).json({ ok: true, data: member });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateCommitteeMemberHandler(req: Request, res: Response) {
  try {
    const member = await updateCommitteeMember(
      req.params.departmentId,
      req.params.memberId,
      req.body || {}
    );
    if (!member) {
      return res.status(404).json({ ok: false, message: "Kamati member haijapatikana." });
    }
    return res.json({ ok: true, data: member });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteCommitteeMemberHandler(req: Request, res: Response) {
  try {
    const success = await deleteCommitteeMember(req.params.departmentId, req.params.memberId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Kamati member haijapatikana." });
    }
    return res.json({ ok: true, message: "Kamati member amefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createDepartmentReportHandler(req: Request, res: Response) {
  try {
    const department = await findDepartmentById(req.params.departmentId);
    if (!department) {
      return res.status(404).json({ ok: false, message: "Idara haijapatikana." });
    }

    const report = await createReport({
      departmentId: department.id,
      title: req.body?.title,
      content: req.body?.content,
      author: req.body?.author,
      reportDate: req.body?.reportDate
    });

    return res.status(201).json({ ok: true, data: report });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateDepartmentReportHandler(req: Request, res: Response) {
  try {
    const report = await updateReport(req.params.reportId, req.body || {});
    if (!report) {
      return res.status(404).json({ ok: false, message: "Report haijapatikana." });
    }
    return res.json({ ok: true, data: report });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteDepartmentReportHandler(req: Request, res: Response) {
  try {
    const success = await deleteReport(req.params.reportId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Report haijapatikana." });
    }
    return res.json({ ok: true, message: "Report imefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
