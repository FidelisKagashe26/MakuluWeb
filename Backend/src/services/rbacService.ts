import {
  ALL_ADMIN_SECTIONS,
  ROLE_PERMISSIONS,
  ROLE_SECTION_ACCESS
} from "../utils/constants.js";

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role, permission) {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

export function getDefaultSectionsForRole(role) {
  return [...(ROLE_SECTION_ACCESS[role] || [])];
}

export function normalizeAllowedSections(role, allowedSections) {
  const defaults = getDefaultSectionsForRole(role);

  if (!Array.isArray(allowedSections) || allowedSections.length === 0) {
    return defaults;
  }

  const normalized = Array.from(
    new Set(
      allowedSections
        .map((section) => String(section || "").trim())
        .filter((section) => ALL_ADMIN_SECTIONS.includes(section))
    )
  );

  if (normalized.length === 0) {
    return defaults;
  }

  return normalized;
}

export function hasSectionAccess(role, allowedSections, section) {
  const sections = normalizeAllowedSections(role, allowedSections);
  return sections.includes(section);
}
