import axios, { type AxiosError } from "axios";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

function resolveApiBaseUrl() {
  const envBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (envBase) {
    return envBase;
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    return `${origin}/api`;
  }

  return "http://localhost:5001/api";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const method = String(error.config?.method || "GET").toUpperCase();
    const path = String(error.config?.url || "");
    const status = error.response?.status ?? "NETWORK";
    // Keep a tiny log so hidden fallback UIs do not mask API failures.
    // eslint-disable-next-line no-console
    console.error(`[API] ${method} ${path} failed (${status})`);
    return Promise.reject(error);
  }
);
