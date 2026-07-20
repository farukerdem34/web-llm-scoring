"use client";

import type {
  LoginResponse,
  RefreshResponse,
  RegisterData,
} from "./types";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg =
      (body as { message?: string })?.message ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

export async function apiLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  return handleResponse<LoginResponse>(res);
}

export async function apiRegister(
  data: RegisterData
): Promise<LoginResponse> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return handleResponse<LoginResponse>(res);
}

export async function apiRefresh(): Promise<RefreshResponse> {
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  return handleResponse<RefreshResponse>(res);
}

export async function apiLogout(accessToken: string): Promise<void> {
  const res = await fetch("/api/v1/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => null);
    const msg =
      (body as { message?: string })?.message ?? "Logout failed";
    throw new Error(msg);
  }
}

export async function apiHealthCheck(): Promise<boolean> {
  try {
    const res = await fetch("/health/live", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
