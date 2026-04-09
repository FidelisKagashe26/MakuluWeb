import { api } from "@/lib/api";
import axios from "axios";
import type { AuthUser } from "@/types/auth";

type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type AuthErrorPayload = {
  message?: string;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
  lockedUntil?: string;
};

function toAuthRequestError(
  error: unknown,
  fallbackMessage: string
): AuthRequestError | unknown {
  if (!axios.isAxiosError(error)) return error;

  const payloadData = (error.response?.data || {}) as AuthErrorPayload;
  const message = String(payloadData?.message || fallbackMessage);
  return new AuthRequestError(message, {
    statusCode: error.response?.status,
    retryAfterSeconds: Number(payloadData?.retryAfterSeconds || 0),
    remainingAttempts: Number(payloadData?.remainingAttempts || 0),
    lockedUntil: payloadData?.lockedUntil
  });
}

export class AuthRequestError extends Error {
  statusCode?: number;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
  lockedUntil?: string;

  constructor(
    message: string,
    details?: {
      statusCode?: number;
      retryAfterSeconds?: number;
      remainingAttempts?: number;
      lockedUntil?: string;
    }
  ) {
    super(message);
    this.name = "AuthRequestError";
    this.statusCode = details?.statusCode;
    this.retryAfterSeconds = details?.retryAfterSeconds;
    this.remainingAttempts = details?.remainingAttempts;
    this.lockedUntil = details?.lockedUntil;
  }
}

export async function loginRequest(payload: { email: string; password: string }) {
  try {
    const response = await api.post("/auth/login", payload);
    return response.data?.data as LoginResponse;
  } catch (error) {
    throw toAuthRequestError(error, "Login failed. Please try again.");
  }
}

export async function requestPasswordReset(payload: { email: string }) {
  try {
    const response = await api.post("/auth/forgot-password", payload);
    return String(response.data?.message || "Password reset email sent.");
  } catch (error) {
    throw toAuthRequestError(
      error,
      "Failed to process forgot password request. Please try again."
    );
  }
}

export async function resetPasswordRequest(payload: { token: string; newPassword: string }) {
  try {
    const response = await api.post("/auth/reset-password", payload);
    return String(response.data?.message || "Password reset successful.");
  } catch (error) {
    throw toAuthRequestError(error, "Failed to reset password. Please try again.");
  }
}

export async function refreshRequest(refreshToken: string) {
  const response = await api.post("/auth/refresh", { refreshToken });
  return response.data?.data as LoginResponse;
}

export async function meRequest() {
  const response = await api.get("/auth/me");
  return response.data?.data as AuthUser;
}

export async function logoutRequest(refreshToken: string | null) {
  await api.post("/auth/logout", { refreshToken });
}
