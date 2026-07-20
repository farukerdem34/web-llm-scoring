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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/2 min-h-[200px] lg:min-h-screen flex flex-col items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-[var(--sand-50)] to-[var(--sand-100)] relative overflow-hidden auth-animate-fade-in">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--terracotta)] opacity-5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[var(--terracotta)] opacity-5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md text-center lg:text-left">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] shadow-lg shadow-[var(--terracotta)]/20 mb-8 auth-animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--ink)] mb-4 auth-animate-slide-up" style={{ animationDelay: "0.2s" }}>
            LLM Playground
          </h1>
          <p className="text-lg text-[var(--ink-muted)] mb-10 leading-relaxed auth-animate-slide-up" style={{ animationDelay: "0.3s" }}>
            Compare models side-by-side with browser-based inference. No servers, no latency, just pure experimentation.
          </p>

          {/* Feature list */}
          <ul className="space-y-4 text-left max-w-sm mx-auto lg:mx-0" role="list">
            {[
              "5 state-of-the-art models ready to run",
              "Real-time streaming with token metrics",
              "Fully private — runs in your browser",
            ].map((text, i) => (
              <li
                key={text}
                className="flex items-center gap-3 text-[var(--ink-muted)] auth-animate-slide-in-left"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-success)] bg-opacity-15 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-[var(--color-success)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>

          {/* Health Status */}
          <div className="mt-10 flex items-center gap-2.5 text-xs text-[var(--ink-faint)] justify-center lg:justify-start auth-animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                isHealthy === null
                  ? "bg-[var(--sand-300)] animate-pulse"
                  : isHealthy
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-error)]"
              }`}
            />
            <span>
              {isHealthy === null
                ? "Checking backend..."
                : isHealthy
                  ? "Backend connected"
                  : "Backend offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-16 bg-[var(--sand-50)] auth-animate-slide-in-right">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div className="glass rounded-2xl p-8 shadow-xl">
            {/* Tabs */}
            <div className="flex mb-8 border-b border-[var(--sand-200)]" role="tablist">
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  aria-controls={`panel-${t}`}
                  id={`tab-${t}`}
                  onClick={() => {
                    setTab(t);
                    clearError();
                  }}
                  className={`relative flex-1 pb-4 text-sm font-semibold transition-colors cursor-pointer ${
                    tab === t
                      ? "text-[var(--terracotta)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--terracotta)] rounded-t-full transition-all duration-300 ${
                      tab === t ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-6 p-3.5 bg-[var(--color-error-light)] border border-[var(--color-error)]/20 rounded-xl flex items-start gap-3"
                role="alert"
                style={{ animation: "slideUp 0.3s ease" }}
              >
                <svg
                  className="w-5 h-5 text-[var(--color-error)] flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="text-sm text-[var(--color-error)]">{error}</p>
              </div>
            )}

            {/* Forms */}
            <div>
              {tab === "signin" ? (
                <div
                  id="panel-signin"
                  role="tabpanel"
                  aria-labelledby="tab-signin"
                  className="auth-animate-fade-in"
                >
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <FloatingField
                      label="Email"
                      type="email"
                      value={siEmail}
                      onChange={setSiEmail}
                      required
                      autoComplete="email"
                    />
                    <FloatingField
                      label="Password"
                      type="password"
                      value={siPassword}
                      onChange={setSiPassword}
                      required
                      autoComplete="current-password"
                    />
                    <GradientButton loading={submitting} label="Sign In" />
                  </form>
                </div>
              ) : (
                <div
                  id="panel-signup"
                  role="tabpanel"
                  aria-labelledby="tab-signup"
                  className="auth-animate-fade-in"
                >
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FloatingField
                        label="First Name"
                        type="text"
                        value={suFirstName}
                        onChange={setSuFirstName}
                        required
                        autoComplete="given-name"
                      />
                      <FloatingField
                        label="Last Name"
                        type="text"
                        value={suLastName}
                        onChange={setSuLastName}
                        required
                        autoComplete="family-name"
                      />
                    </div>
                    <FloatingField
                      label="Email"
                      type="email"
                      value={suEmail}
                      onChange={setSuEmail}
                      required
                      autoComplete="email"
                    />
                    <FloatingField
                      label="Password"
                      type="password"
                      value={suPassword}
                      onChange={setSuPassword}
                      required
                      autoComplete="new-password"
                    />
                    <GradientButton loading={submitting} label="Create Account" />
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-xs text-[var(--ink-faint)]">
            All inference runs locally in your browser using WebGPU
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes auth-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes auth-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes auth-slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes auth-slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-animate-fade-in {
          animation: auth-fade-in 0.6s ease both;
        }

        .auth-animate-slide-up {
          animation: auth-slide-up 0.6s ease both;
        }

        .auth-animate-slide-in-left {
          animation: auth-slide-in-left 0.5s ease both;
        }

        .auth-animate-slide-in-right {
          animation: auth-slide-in-right 0.6s ease both;
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}

function FloatingField({
  label,
  type,
  value,
  onChange,
  required,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        autoComplete={autoComplete}
        aria-label={label}
        className="peer w-full h-12 px-4 pt-5 pb-1 text-sm border border-[var(--sand-200)] rounded-lg bg-white/50 text-[var(--ink)] placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:border-[var(--terracotta)] transition-all duration-200"
        placeholder={label}
      />
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isActive
            ? "top-1.5 text-[10px] font-medium text-[var(--terracotta)]"
            : "top-1/2 -translate-y-1/2 text-sm text-[var(--ink-faint)]"
        }`}
      >
        {label}
      </label>
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[var(--terracotta)] rounded-full transition-all duration-300 ${
          focused ? "w-full" : "w-0"
        }`}
      />
    </div>
  );
}

function GradientButton({
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
      className="relative w-full h-12 mt-2 px-6 text-sm font-semibold text-white rounded-lg overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)] focus:ring-offset-2 cursor-pointer group"
      style={{
        background: loading
          ? "var(--sand-300)"
          : "linear-gradient(135deg, var(--terracotta) 0%, var(--terracotta-dark) 100%)",
        boxShadow: loading ? "none" : "0 4px 14px rgba(217, 119, 87, 0.35)",
      }}
    >
      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {loading ? "Please wait..." : label}
      </span>
    </button>
  );
}
