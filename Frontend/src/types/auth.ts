export type Permission = "create" | "update" | "delete" | "view" | "publish";

export type Role = "super_admin" | "admin" | "editor";

export type AdminSection =
  | "dashboard"
  | "settings"
  | "library"
  | "departments"
  | "leaders"
  | "groups"
  | "reports"
  | "media"
  | "announcements"
  | "users"
  | "account";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: string;
  lastLoginAt?: string | null;
  allowedSections: AdminSection[];
  permissions: Permission[];
};
