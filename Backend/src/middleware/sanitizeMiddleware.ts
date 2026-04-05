import { sanitizePayload } from "../utils/sanitize.js";

export function sanitizeRequest(req, _res, next) {
  req.body = sanitizePayload(req.body);
  req.query = sanitizePayload(req.query);
  req.params = sanitizePayload(req.params);
  next();
}
