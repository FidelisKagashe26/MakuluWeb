import axios, { type AxiosError } from "axios";

let accessToken: string | null = null;
let pendingApiRequests = 0;
const pendingApiListeners = new Set<(count: number) => void>();

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

function emitPendingApiRequests() {
  for (const listener of pendingApiListeners) {
    listener(pendingApiRequests);
  }
}

function beginTrackedRequest(config: any) {
  const skipTracking = Boolean(config?.meta?.skipGlobalLoading);
  if (skipTracking) return;

  config.meta = {
    ...(config.meta || {}),
    _tracksGlobalLoading: true
  };

  pendingApiRequests += 1;
  emitPendingApiRequests();
}

function finishTrackedRequest(config: any) {
  if (!config?.meta?._tracksGlobalLoading) return;

  pendingApiRequests = Math.max(0, pendingApiRequests - 1);
  emitPendingApiRequests();
}

export function getPendingApiRequestsCount() {
  return pendingApiRequests;
}

export function subscribePendingApiRequests(listener: (count: number) => void) {
  pendingApiListeners.add(listener);
  listener(pendingApiRequests);

  return () => {
    pendingApiListeners.delete(listener);
  };
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
  beginTrackedRequest(config);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    finishTrackedRequest(response.config);
    return response;
  },
  (error: AxiosError) => {
    finishTrackedRequest(error.config);
    const method = String(error.config?.method || "GET").toUpperCase();
    const path = String(error.config?.url || "");
    const status = error.response?.status ?? "NETWORK";
    // Keep a tiny log so hidden fallback UIs do not mask API failures.
    // eslint-disable-next-line no-console
    console.error(`[API] ${method} ${path} failed (${status})`);
    return Promise.reject(error);
  }
);
