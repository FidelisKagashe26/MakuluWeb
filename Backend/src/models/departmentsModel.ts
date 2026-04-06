import { DepartmentDbModel } from "../database/models/departmentDbModel.js";
import { ReportDbModel } from "../database/models/reportDbModel.js";
import { generateId } from "../utils/id.js";
import { normalizeUploadPath } from "../utils/uploadPath.js";

export async function listDepartments() {
  const items = await DepartmentDbModel.find().sort({ createdAt: -1 }).lean();
  return items.map((item: any) => ({
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl)
  }));
}

export async function findDepartmentById(id) {
  const item = await DepartmentDbModel.findOne({ id }).lean();
  if (!item) return null;

  return {
    ...item,
    imageUrl: normalizeUploadPath(item?.imageUrl)
  };
}

export async function createDepartment(payload) {
  const item = {
    id: payload.id || generateId("dep"),
    name: payload.name,
    description: payload.description || "",
    imageUrl: normalizeUploadPath(payload.imageUrl),
    createdAt: new Date().toISOString(),
    committee: payload.committee || []
  };

  await DepartmentDbModel.create(item);
  return item;
}

export async function updateDepartment(id, payload) {
  const nextPayload = {
    ...(payload || {})
  };

  if (Object.prototype.hasOwnProperty.call(nextPayload, "imageUrl")) {
    nextPayload.imageUrl = normalizeUploadPath(nextPayload.imageUrl);
  }

  const updated = await DepartmentDbModel.findOneAndUpdate(
    { id },
    { $set: nextPayload },
    { returnDocument: "after" }
  ).lean();

  if (!updated) return null;

  return {
    ...updated,
    imageUrl: normalizeUploadPath(updated?.imageUrl)
  };
}

export async function deleteDepartment(id) {
  const result = await DepartmentDbModel.deleteOne({ id });
  if (result.deletedCount === 0) return false;

  await ReportDbModel.deleteMany({ departmentId: id });
  return true;
}

export async function addCommitteeMember(departmentId, payload) {
  const department = await DepartmentDbModel.findOne({ id: departmentId });
  if (!department) return null;

  const member = {
    id: generateId("cm"),
    name: payload.name,
    title: payload.title,
    description: payload.description || ""
  };

  department.committee.push(member as any);
  await department.save();

  return member;
}

export async function updateCommitteeMember(departmentId, memberId, payload) {
  const department = await DepartmentDbModel.findOne({ id: departmentId });
  if (!department) return null;

  const member = (department.committee || []).find((item: any) => item.id === memberId);
  if (!member) return null;

  Object.assign(member, payload || {});
  await department.save();

  return member;
}

export async function deleteCommitteeMember(departmentId, memberId) {
  const department = await DepartmentDbModel.findOne({ id: departmentId });
  if (!department) return false;

  const index = (department.committee || []).findIndex((item: any) => item.id === memberId);
  if (index === -1) return false;

  department.committee.splice(index, 1);
  await department.save();

  return true;
}

