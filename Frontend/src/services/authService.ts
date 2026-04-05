import { api } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export async function loginRequest(payload: { email: string; password: string }) {
  const response = await api.post("/auth/login", payload);
  return response.data?.data as LoginResponse;
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
