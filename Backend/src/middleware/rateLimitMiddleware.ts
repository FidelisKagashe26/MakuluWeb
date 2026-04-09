import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Ombi limezidi kiwango, jaribu tena baadaye." }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many login attempts. Please wait and try again." }
});
