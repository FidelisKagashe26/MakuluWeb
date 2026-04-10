import type { AdminSection, Role } from "@/types/auth";

export type AdminSectionOption = {
  key: AdminSection;
  label: string;
  description: string;
};

export const adminSectionOptions: AdminSectionOption[] = [
  { key: "dashboard", label: "Dashboard", description: "Muhtasari wa takwimu za mfumo." },
  { key: "settings", label: "Settings", description: "Mipangilio ya tovuti na muonekano." },
  { key: "library", label: "Maktaba", description: "Usimamizi wa nyaraka za maktaba." },
  { key: "departments", label: "Departments", description: "Usimamizi wa idara na kamati." },
  { key: "leaders", label: "Leaders", description: "Usimamizi wa viongozi wa kanisa." },
  { key: "groups", label: "Groups", description: "Usimamizi wa vikundi na kwaya." },
  { key: "reports", label: "Reports", description: "Usimamizi wa ripoti za idara." },
  { key: "media", label: "Media", description: "Usimamizi wa picha na video." },
  {
    key: "announcements",
    label: "Matukio",
    description: "Usimamizi wa matukio ya kanisa (yajayo, yanayoendelea, na yaliyopita)."
  },
  { key: "users", label: "Users", description: "Usimamizi wa watumiaji na ruhusa." },
  { key: "account", label: "My Account", description: "Akaunti ya mtumiaji na nenosiri." }
];

export const allAdminSections: AdminSection[] = adminSectionOptions.map((item) => item.key);

export const defaultSectionsByRole: Record<Role, AdminSection[]> = {
  super_admin: [...allAdminSections],
  admin: [...allAdminSections],
  editor: [
    "dashboard",
    "departments",
    "leaders",
    "groups",
    "reports",
    "media",
    "announcements",
    "account"
  ]
};

export function normalizeSections(role: Role, sections: unknown): AdminSection[] {
  const defaults = defaultSectionsByRole[role] || [];
  if (!Array.isArray(sections) || sections.length === 0) {
    return [...defaults];
  }

  const next = Array.from(
    new Set(
      sections
        .map((entry) => String(entry || "").trim() as AdminSection)
        .filter((entry) => allAdminSections.includes(entry))
    )
  );

  return next.length > 0 ? next : [...defaults];
}
