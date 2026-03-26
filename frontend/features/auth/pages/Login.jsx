import { useState } from "react";
import { Link } from "react-router-dom";
import { login, forgotPassword } from "@shared/auth/authService";
import { BACKEND_URL } from "@shared/api/backendUrl";
import { AuthPageShell } from "@shared/components/AuthPageShell";
import { PasswordInput } from "@shared/components/PasswordInput";

export function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      const raw = identifier;

      // If input doesn't look like an email, resolve username → email
      if (!raw.includes("@")) {
        // Reject leading/trailing whitespace — must be exact username
        if (!raw || raw !== raw.trim()) {
          setError("Invalid username/email or password.");
          return;
        }
        const res = await fetch(
          `${BACKEND_URL}/users/resolve?username=${encodeURIComponent(raw)}`
        );
        if (!res.ok) {
          setError("Invalid username/email or password.");
          return;
        }
        const body = await res.json();
        await login(body.email, password);
      } else {
        await login(raw.trim(), password);
      }
    } catch (err) {
      setError("Invalid username/email or password.");
    }
  }

  async function handleForgotSubmit(event) {
    event.preventDefault();
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
    } catch {
      // Intentionally swallow errors to prevent email enumeration
    } finally {
      setForgotSent(true);
      setForgotLoading(false);
    }
  }

  function handleBackToLogin() {
    setIsForgotMode(false);
    setForgotSent(false);
    setForgotEmail("");
    setError(null);
  }

  return (
    <AuthPageShell
      title={isForgotMode ? "Reset password" : "Welcome back"}
      subtitle={isForgotMode ? "We'll send a reset link to your email" : "Log in to continue"}
    >
      {isForgotMode ? (
        <>
          {forgotSent ? (
            <div className="mt-1">
              <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                If an account with that email exists, a reset link has been sent. Check your inbox.
              </p>
              <button
                onClick={handleBackToLogin}
                className="mt-4 text-sm text-slate-600 underline underline-offset-4 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Back to log in
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="mt-5 space-y-4">
              <label htmlFor="forgot-email" className="block text-sm text-slate-600 dark:text-slate-400">Email</label>
              <input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300/70 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-700/70"
              />
              <input
                type="submit"
                disabled={forgotLoading}
                value={forgotLoading ? "Sending..." : "Send reset link"}
                className="mt-2 w-full cursor-pointer rounded-xl border border-transparent bg-slate-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-300"
              />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="underline underline-offset-4 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Back to log in
                </button>
              </p>
            </form>
          )}
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="identifier" className="block text-sm text-slate-600 dark:text-slate-400">Email or username</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300/70 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-700/70"
            />
            <p className="mt-0.5 min-h-[1.25rem] pl-0.5 text-xs text-transparent">
              &nbsp;
            </p>
            <label htmlFor="password" className="block text-sm text-slate-600 dark:text-slate-400">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="-mt-1 flex justify-center">
              <button
                type="button"
                onClick={() => { setIsForgotMode(true); setError(null); }}
                className="px-2 pb-2 pt-0.5 text-xs text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
              >
                Forgot password?
              </button>
            </div>
            <input
              role="submit-button"
              id="submit"
              type="submit"
              value="Log in"
              disabled={!identifier || !password}
              className="mt-2 w-full cursor-pointer rounded-xl border border-transparent bg-slate-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-300"
            />
          </form>
          {error && (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="px-1 pb-2 pt-0.5 text-slate-800 underline underline-offset-4 hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-300"
            >
              Sign up
            </Link>
          </p>
        </>
      )}
    </AuthPageShell>
  );
}
