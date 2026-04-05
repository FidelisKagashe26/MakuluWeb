export type Permission = "create" | "update" | "delete" | "view" | "publish";

export type Role = "super_admin" | "admin" | "editor";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: string;
  lastLoginAt?: string | null;
  permissions: Permission[];
};
