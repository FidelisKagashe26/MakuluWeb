import { ReportDbModel } from "../database/models/reportDbModel.js";
import { generateId } from "../utils/id.js";

export async function listReports() {
  return ReportDbModel.find().sort({ reportDate: -1 }).lean();
}

export async function findReportById(id) {
  return ReportDbModel.findOne({ id }).lean();
}

export async function createReport(payload) {
  const report = {
    id: generateId("rep"),
    departmentId: payload.departmentId,
    title: payload.title,
    content: payload.content || "",
    reportDate: payload.reportDate || new Date().toISOString(),
    author: payload.author || "",
    attachments: payload.attachments || []
  };

  await ReportDbModel.create(report);
  return report;
}

export async function updateReport(id, payload) {
  return ReportDbModel.findOneAndUpdate({ id }, { $set: payload || {} }, { returnDocument: "after" }).lean();
}

export async function deleteReport(id) {
  const result = await ReportDbModel.deleteOne({ id });
  return result.deletedCount > 0;
}

