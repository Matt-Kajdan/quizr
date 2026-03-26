import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "@shared/auth/authService";
import { apiFetch } from "@shared/api/apiClient";
import { BACKEND_URL } from "@shared/api/backendUrl";
import { AuthPageShell } from "@shared/components/AuthPageShell";
import { useUser } from "@shared/state/useUser";
import { PasswordInput } from "@shared/components/PasswordInput";
import { formatUsernameInput, trimTrailingSpace } from "@shared/utils/usernameValidation";
import { setSigningUp as setSignupGate } from "@shared/auth/signupGate";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [emailInUse, setEmailInUse] = useState(false);
  const [usernameWarning, setUsernameWarning] = useState(null);
  const [emailWarning, setEmailWarning] = useState(null);

  const { refreshUser } = useUser();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setEmailInUse(false);
    try {
      if (!username.trim()) {
        setError("Username is required");
        return;
      }
      if (password.length < 12) {
        setError("Password must be at least 12 characters long");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      const availabilityRes = await fetch(
        `${BACKEND_URL}/users/availability?username=${encodeURIComponent(username)}`);
      const availabilityBody = await availabilityRes.json().catch(() => ({}));
      if (!availabilityRes.ok) {
        throw new Error(availabilityBody.message || "Unable to check username");
      }
      const { available } = availabilityBody;
      if (!available) {
        setError("Username already taken");
        return;
      }

      setSignupGate(true);
      await signup(email, password);
      const res = await apiFetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Unable to create user");
      }
      setSignupGate(false);
      await refreshUser();
      navigate("/");
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setEmailInUse(true);
      } else {
        setError(err.message || "Signup failed");
      }
      setSignupGate(false);
    }
  }

  return (
    <AuthPageShell
      title="Create your account"
      subtitle="Join Quizr and start playing"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="username" className="block text-sm text-slate-600">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => {
            const input = e.target;
            const cursorPos = input.selectionStart;
            const raw = e.target.value;
            const { value, warning } = formatUsernameInput(raw);
            const charsRemoved = raw.length - value.length;
            const newCursor = Math.max(0, cursorPos - charsRemoved);
            setUsername(value);
            if (warning) setUsernameWarning(warning);
            else setUsernameWarning(null);
            requestAnimationFrame(() => {
              input.setSelectionRange(newCursor, newCursor);
            });
          }}
          onBlur={() => {
            const { value, warning } = trimTrailingSpace(username);
            setUsername(value);
            if (warning) setUsernameWarning(warning);
          }}
          onFocus={() => setUsernameWarning(null)}
          className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300/70"
        />
        <p className={`mt-0.5 min-h-[1.25rem] pl-0.5 text-xs ${usernameWarning ? "text-rose-500" : "text-transparent"}`}>
          {usernameWarning || "\u00A0"}
        </p>
        <label htmlFor="email" className="block text-sm text-slate-600">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailWarning(null); }}
          onBlur={() => {
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              setEmailWarning("Please enter a valid email address.");
            }
          }}
          className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300/70"
        />
        <p className={`mt-0.5 min-h-[1.25rem] pl-0.5 text-xs ${emailWarning ? "text-rose-500" : "text-transparent"}`}>
          {emailWarning || "\u00A0"}
        </p>
        <label htmlFor="password" className="block text-sm text-slate-600">Password</label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={12}
        />
        <p className="mt-0.5 min-h-[1.25rem] pl-0.5 text-xs text-slate-500">Must be at least 12 characters long.</p>
        <label htmlFor="confirmPassword" className="block text-sm text-slate-600">Confirm Password</label>
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          minLength={12}
        />
        <p className={`mt-0.5 min-h-[1.25rem] pl-0.5 text-xs ${
          confirmPassword && confirmPassword !== password
            ? "text-rose-500"
            : "text-transparent"
        }`}>
          {confirmPassword && confirmPassword !== password ? "Passwords do not match." : "\u00A0"}
        </p>
        <input
          role="submit-button"
          id="submit"
          type="submit"
          value="Sign up"
          disabled={!username || !email || !password || !confirmPassword}
          className="mt-2 w-full cursor-pointer rounded-xl bg-slate-800 dark:bg-blue-950/60 text-white px-6 py-3 font-semibold transition-colors hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </form>
      {error && (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {emailInUse && (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          Email already in use.{" "}
          <Link to="/login" className="underline underline-offset-4 hover:text-rose-600">Log in</Link>
        </p>
      )}
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="px-1 pb-2 pt-0.5 text-slate-800 underline underline-offset-4 hover:text-slate-600"
        >
          Log in
        </Link>
      </p>
    </AuthPageShell>
  );
}
