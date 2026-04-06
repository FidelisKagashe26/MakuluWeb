import { PERMISSIONS } from "../utils/constants.js";
import { hasPermission, hasSectionAccess } from "../services/rbacService.js";

export function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role || !hasPermission(role, permission)) {
      return res.status(403).json({
        ok: false,
        message: "Huna ruhusa ya kufanya kitendo hiki."
      });
    }
    return next();
  };
}

export function requireSection(section, permission = PERMISSIONS.VIEW) {
  return (req, res, next) => {
    const role = req.auth?.role;
    const allowedSections = req.auth?.allowedSections;
    if (!role || !hasPermission(role, permission) || !hasSectionAccess(role, allowedSections, section)) {
      return res.status(403).json({
        ok: false,
        message: "Huna ruhusa ya kufungua sehemu hii."
      });
    }
    return next();
  };
}

export function requireAnySection(sections, permission = PERMISSIONS.VIEW) {
  return (req, res, next) => {
    const role = req.auth?.role;
    const allowedSections = req.auth?.allowedSections;
    if (!role || !hasPermission(role, permission)) {
      return res.status(403).json({
        ok: false,
        message: "Huna ruhusa ya kufanya kitendo hiki."
      });
    }

    const hasAny = Array.isArray(sections)
      ? sections.some((section) => hasSectionAccess(role, allowedSections, section))
      : false;

    if (!hasAny) {
      return res.status(403).json({
        ok: false,
        message: "Huna ruhusa ya kufungua sehemu hii."
      });
    }

    return next();
  };
}
