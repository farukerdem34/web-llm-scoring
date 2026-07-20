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

const TOKEN_KEY = "llm-playground-token";
const USER_KEY = "llm-playground-user";

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
  const hydrated = useRef(false);

  // Restore session from sessionStorage on client only
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const userJson = sessionStorage.getItem(USER_KEY);
      if (token && userJson) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate client-side state restoration
        setAccessToken(token);
        setUser(JSON.parse(userJson) as AuthUser);
        setAuthCookie();
      }
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist to sessionStorage whenever token/user changes
  useEffect(() => {
    if (!hydrated.current) return;
    if (accessToken && user) {
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      setAuthCookie();
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  }, [accessToken, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const { apiLogin } = await import("@/app/lib/auth");
        const data = await apiLogin(email, password);
        setAccessToken(data.access_token);
        setUser(data.user);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        setError(msg);
        throw err;
      }
    },
    []
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
        const { apiRegister, apiLogin } = await import("@/app/lib/auth");
        await apiRegister(data);
        const loginData = await apiLogin(data.email, data.password);
        setAccessToken(loginData.access_token);
        setUser(loginData.user);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Registration failed";
        setError(msg);
        throw err;
      }
    },
    []
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
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
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
