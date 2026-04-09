import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  me,
  refreshToken,
  resetPassword
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router = Router();

router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
