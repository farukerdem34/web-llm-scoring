"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/app/lib/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthState | null>(null);

function setAuthCookie() {
  document.cookie = "auth_session=1; path=/; SameSite=Lax; max-age=86400";
}

function clearAuthCookie() {
  document.cookie = "auth_session=; path=/; max-age=0";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefreshRef = useRef<((expiresIn: number) => void) | null>(null);

  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const ms = Math.max((expiresIn - 60) * 1000, 10_000);
    refreshTimer.current = setTimeout(async () => {
      try {
        const { apiRefresh } = await import("@/app/lib/auth");
        const data = await apiRefresh();
        setAccessToken(data.access_token);
        scheduleRefreshRef.current?.(data.expires_in);
      } catch {
        setUser(null);
        setAccessToken(null);
        clearAuthCookie();
      }
    }, ms);
  }, []);

  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh;
  }, [scheduleRefresh]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { apiRefresh } = await import("@/app/lib/auth");
        const data = await apiRefresh();
        if (cancelled) return;
        setAccessToken(data.access_token);
        scheduleRefresh(data.expires_in);
        setUser({
          id: "",
          email: "",
          first_name: "",
          last_name: "",
          status: "active",
        });
        setAuthCookie();
      } catch {
        // No session — user must log in
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const { apiLogin } = await import("@/app/lib/auth");
        const data = await apiLogin(email, password);
        setAccessToken(data.access_token);
        setUser(data.user);
        scheduleRefresh(data.expires_in);
        setAuthCookie();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        setError(msg);
        throw err;
      }
    },
    [scheduleRefresh]
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    }) => {
      setError(null);
      try {
        const { apiRegister } = await import("@/app/lib/auth");
        const result = await apiRegister(data);
        setAccessToken(result.access_token);
        setUser(result.user);
        scheduleRefresh(result.expires_in);
        setAuthCookie();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Registration failed";
        setError(msg);
        throw err;
      }
    },
    [scheduleRefresh]
  );

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        const { apiLogout } = await import("@/app/lib/auth");
        await apiLogout(accessToken);
      }
    } catch {
      // Continue with local cleanup even if API call fails
    } finally {
      setUser(null);
      setAccessToken(null);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      clearAuthCookie();
    }
  }, [accessToken]);

  const getAuthHeaders = useCallback(
    (): Record<string, string> =>
      accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    [accessToken]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError: () => setError(null),
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
