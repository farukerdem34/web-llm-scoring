"use client";

import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useHealthCheck } from "@/app/hooks/useHealthCheck";

type Tab = "signin" | "signup";

export function AuthScreen() {
  const { login, register, error, clearError } = useAuth();
  const { isHealthy } = useHealthCheck(30_000);
  const [tab, setTab] = useState<Tab>("signin");
  const [submitting, setSubmitting] = useState(false);

  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suFirstName, setSuFirstName] = useState("");
  const [suLastName, setSuLastName] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await login(siEmail, siPassword);
    } catch {
      // error set by useAuth
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await register({
        email: suEmail,
        password: suPassword,
        first_name: suFirstName,
        last_name: suLastName,
      });
    } catch {
      // error set by useAuth
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sand-50)] px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">
            LLM Playground
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Compare models side-by-side with browser-based inference
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[var(--sand-200)] rounded-xl shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-[var(--sand-200)]">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  clearError();
                }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors cursor-pointer ${
                  tab === t
                    ? "text-[var(--terracotta)] border-b-2 border-[var(--terracotta)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mt-5 p-3 bg-[var(--terracotta-light)] border border-[var(--terracotta)]/20 rounded-lg">
              <p className="text-sm text-[var(--terracotta-dark)]">{error}</p>
            </div>
          )}

          {/* Forms */}
          <div className="p-5">
            {tab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field
                  label="Email"
                  type="email"
                  value={siEmail}
                  onChange={setSiEmail}
                  required
                />
                <Field
                  label="Password"
                  type="password"
                  value={siPassword}
                  onChange={setSiPassword}
                  required
                />
                <SubmitButton loading={submitting} label="Sign In" />
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="First Name"
                    type="text"
                    value={suFirstName}
                    onChange={setSuFirstName}
                    required
                  />
                  <Field
                    label="Last Name"
                    type="text"
                    value={suLastName}
                    onChange={setSuLastName}
                    required
                  />
                </div>
                <Field
                  label="Email"
                  type="email"
                  value={suEmail}
                  onChange={setSuEmail}
                  required
                />
                <Field
                  label="Password"
                  type="password"
                  value={suPassword}
                  onChange={setSuPassword}
                  required
                />
                <SubmitButton loading={submitting} label="Sign Up" />
              </form>
            )}
          </div>
        </div>

        {/* Health Status */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[var(--ink-faint)]">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isHealthy === null
                ? "bg-[var(--sand-300)]"
                : isHealthy
                  ? "bg-[var(--color-success)]"
                  : "bg-[var(--color-error)]"
            }`}
          />
          <span>
            {isHealthy === null
              ? "Checking backend..."
              : isHealthy
                ? "Backend healthy"
                : "Backend unreachable"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 text-sm border border-[var(--sand-200)] rounded-lg bg-white text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:border-[var(--terracotta)] transition-colors"
      />
    </div>
  );
}

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 px-4 text-sm font-medium text-white bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:ring-offset-2 cursor-pointer"
    >
      {loading ? "Please wait..." : label}
    </button>
  );
}
