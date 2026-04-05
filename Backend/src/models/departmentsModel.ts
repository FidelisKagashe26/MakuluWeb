import { DepartmentDbModel } from "../database/models/departmentDbModel.js";
import { ReportDbModel } from "../database/models/reportDbModel.js";
import { generateId } from "../utils/id.js";

export async function listDepartments() {
  return DepartmentDbModel.find().sort({ createdAt: -1 }).lean();
}

export async function findDepartmentById(id) {
  return DepartmentDbModel.findOne({ id }).lean();
}

export async function createDepartment(payload) {
  const item = {
    id: payload.id || generateId("dep"),
    name: payload.name,
    description: payload.description || "",
    imageUrl: payload.imageUrl || "",
    createdAt: new Date().toISOString(),
    committee: payload.committee || []
  };

  await DepartmentDbModel.create(item);
  return item;
}

export async function updateDepartment(id, payload) {
  const updated = await DepartmentDbModel.findOneAndUpdate(
    { id },
    { $set: payload || {} },
    { returnDocument: "after" }
  ).lean();

  return updated;
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

