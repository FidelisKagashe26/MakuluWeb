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
    if (axios.isAxiosError(error)) {
      const payloadData = (error.response?.data || {}) as AuthErrorPayload;
      const message = String(
        payloadData?.message || "Login failed. Please try again."
      );
      throw new AuthRequestError(message, {
        statusCode: error.response?.status,
        retryAfterSeconds: Number(payloadData?.retryAfterSeconds || 0),
        remainingAttempts: Number(payloadData?.remainingAttempts || 0),
        lockedUntil: payloadData?.lockedUntil
      });
    }
    throw error;
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
