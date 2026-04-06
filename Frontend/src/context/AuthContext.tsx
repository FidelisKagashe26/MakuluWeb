import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setAccessToken } from "@/lib/api";
import { loginRequest, logoutRequest, meRequest, refreshRequest } from "@/services/authService";
import { normalizeSections } from "@/lib/adminAccess";
import type { AdminSection, AuthUser, Permission } from "@/types/auth";

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasSectionAccess: (section: AdminSection) => boolean;
};

const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const SESSION_EXPIRES_AT_KEY = "admin_session_expires_at";
const ADMIN_SESSION_DURATION_MS = 15 * 60 * 1000;
const SESSION_BUMP_THROTTLE_MS = 15 * 1000;
const TOKEN_REFRESH_THROTTLE_MS = 4 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredToken(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function storeToken(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

function loadSessionExpiresAt() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_EXPIRES_AT_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function storeSessionExpiresAt(value: number | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(value));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(loadSessionExpiresAt);
  const lastSessionBumpAtRef = useRef(0);
  const lastTokenRefreshAtRef = useRef(0);
  const refreshInFlightRef = useRef(false);

  const normalizeAuthUser = useCallback((nextUser: AuthUser | null) => {
    if (!nextUser) return null;
    return {
      ...nextUser,
      allowedSections: normalizeSections(nextUser.role, nextUser.allowedSections)
    };
  }, []);

  const extendSessionWindow = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastSessionBumpAtRef.current < SESSION_BUMP_THROTTLE_MS) {
      return;
    }
    lastSessionBumpAtRef.current = now;

    const expiresAt = now + ADMIN_SESSION_DURATION_MS;
    storeSessionExpiresAt(expiresAt);
    setSessionExpiresAt(expiresAt);
  }, []);

  const applyTokens = useCallback((nextAccessToken: string | null, nextRefreshToken: string | null) => {
    setAccessToken(nextAccessToken);
    storeToken(ACCESS_TOKEN_KEY, nextAccessToken);
    storeToken(REFRESH_TOKEN_KEY, nextRefreshToken);
  }, []);

  const clearSession = useCallback(
    (redirectToLogin = false) => {
      applyTokens(null, null);
      storeSessionExpiresAt(null);
      setSessionExpiresAt(null);
      setUser(null);
      lastSessionBumpAtRef.current = 0;
      lastTokenRefreshAtRef.current = 0;
      refreshInFlightRef.current = false;

      if (redirectToLogin && typeof window !== "undefined") {
        window.location.replace("/admin/login");
      }
    },
    [applyTokens]
  );

  const fetchMe = useCallback(async () => {
    const nextUser = await meRequest();
    setUser(normalizeAuthUser(nextUser ?? null));
  }, [normalizeAuthUser]);

  const refreshSession = useCallback(async () => {
    const expiresAt = loadSessionExpiresAt();
    if (!expiresAt || Date.now() >= expiresAt) {
      clearSession(false);
      return false;
    }

    const refreshToken = loadStoredToken(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const response = await refreshRequest(refreshToken);
      const nextAccessToken = response?.accessToken ?? null;
      const nextRefreshToken = response?.refreshToken ?? null;
      const nextUser = response?.user ?? null;

      applyTokens(nextAccessToken, nextRefreshToken);
      setUser(normalizeAuthUser(nextUser));
      lastTokenRefreshAtRef.current = Date.now();
      return true;
    } catch {
      clearSession(false);
      return false;
    }
  }, [applyTokens, clearSession]);

  const expireNow = useCallback(async () => {
    const refreshToken = loadStoredToken(REFRESH_TOKEN_KEY);
    try {
      await logoutRequest(refreshToken);
    } catch {
      // ignore logout errors on forced expiry
    } finally {
      clearSession(true);
    }
  }, [clearSession]);

  useEffect(() => {
    const bootstrap = async () => {
      const expiresAt = loadSessionExpiresAt();
      if (!expiresAt || Date.now() >= expiresAt) {
        clearSession(false);
        setIsLoading(false);
        return;
      }

      setSessionExpiresAt(expiresAt);
      const access = loadStoredToken(ACCESS_TOKEN_KEY);
      if (access) {
        setAccessToken(access);
        try {
          await fetchMe();
          lastTokenRefreshAtRef.current = Date.now();
          setIsLoading(false);
          return;
        } catch {
          const refreshed = await refreshSession();
          if (refreshed) {
            setIsLoading(false);
            return;
          }
        }
      }

      setIsLoading(false);
    };

    void bootstrap();
  }, [clearSession, fetchMe, refreshSession]);

  useEffect(() => {
    if (!user || !sessionExpiresAt) return;

    const remainingMs = sessionExpiresAt - Date.now();
    if (remainingMs <= 0) {
      void expireNow();
      return;
    }

    const timer = window.setTimeout(() => {
      void expireNow();
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [expireNow, sessionExpiresAt, user]);

  useEffect(() => {
    if (!user) return;

    const maybeRefreshSession = () => {
      if (refreshInFlightRef.current) return;
      const now = Date.now();
      if (now - lastTokenRefreshAtRef.current < TOKEN_REFRESH_THROTTLE_MS) return;

      refreshInFlightRef.current = true;
      void refreshSession().finally(() => {
        refreshInFlightRef.current = false;
      });
    };

    const handleActivity = () => {
      extendSessionWindow();
      maybeRefreshSession();
    };

    const events: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
      "focus"
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, [extendSessionWindow, refreshSession, user]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_EXPIRES_AT_KEY) return;
      setSessionExpiresAt(loadSessionExpiresAt());
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      const nextAccessToken = response?.accessToken ?? null;
      const nextRefreshToken = response?.refreshToken ?? null;
      const nextUser = response?.user ?? null;

      applyTokens(nextAccessToken, nextRefreshToken);
      lastTokenRefreshAtRef.current = Date.now();
      extendSessionWindow(true);
      setUser(normalizeAuthUser(nextUser));
    },
    [applyTokens, extendSessionWindow, normalizeAuthUser]
  );

  const logout = useCallback(async () => {
    const refreshToken = loadStoredToken(REFRESH_TOKEN_KEY);
    try {
      await logoutRequest(refreshToken);
    } catch {
      // ignore logout errors
    } finally {
      clearSession(false);
    }
  }, [clearSession]);

  const hasPermission = useCallback(
    (permission: Permission) => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  const hasSectionAccess = useCallback(
    (section: AdminSection) => {
      if (!user) return false;
      const allowedSections = normalizeSections(user.role, user.allowedSections);
      return allowedSections.includes(section);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      hasPermission,
      hasSectionAccess
    }),
    [user, isLoading, login, logout, hasPermission, hasSectionAccess]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth lazima itumike ndani ya AuthProvider.");
  }
  return context;
}
