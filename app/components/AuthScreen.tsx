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

  // Sign In fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign Up fields
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            LLM Playground
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Compare Gemma models side-by-side with browser-based inference
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  clearError();
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Forms */}
          <div className="p-4">
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
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy === null
                ? "bg-slate-300 dark:bg-slate-600"
                : isHealthy
                  ? "bg-green-500"
                  : "bg-red-500"
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
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
      className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {loading ? "Please wait..." : label}
    </button>
  );
}
