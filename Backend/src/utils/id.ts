import { randomUUID } from "node:crypto";

export function generateId(prefix = "id") {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}
