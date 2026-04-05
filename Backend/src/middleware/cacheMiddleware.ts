import { env } from "../config/env.js";

const cache = new Map();

export function cacheGet(ttlMs = env.apiCacheTtlMs) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();
    const key = req.originalUrl;
    const hit = cache.get(key);
    const now = Date.now();

    if (hit && hit.expiresAt > now) {
      return res.json(hit.value);
    }

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      cache.set(key, {
        value: payload,
        expiresAt: Date.now() + ttlMs
      });
      return originalJson(payload);
    };

    return next();
  };
}

export function clearApiCache() {
  cache.clear();
}
