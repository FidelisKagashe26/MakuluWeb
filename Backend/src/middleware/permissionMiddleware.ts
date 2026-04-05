import { hasPermission } from "../services/rbacService.js";

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
