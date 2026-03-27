import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Field } from "@shared/components/Field";
import { PasswordInput } from "@shared/components/PasswordInput";
import { apiFetch } from "@shared/api/apiClient";
import { useAuth } from "@shared/auth/useAuth";
import { PageShell } from "@shared/components/PageShell";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@shared/components/Button";
import { UserAvatar } from "@shared/components/UserAvatar";
import { scheduleAccountDeletion } from "@features/users/api/users";
import { useUser } from "@shared/state/useUser";
import { formatUsernameInput, trimTrailingSpace, toProfileUrl } from "@shared/utils/usernameValidation";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "email", label: "Email" },
  { id: "password", label: "Password" },
  { id: "delete", label: "Delete Account" },
];

const panelClassName = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-lg rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/60 shadow-sm";
const inputClassName = "w-full px-4 py-3 bg-white/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300/70 dark:focus:ring-slate-700/50 disabled:opacity-50";
const labelClassName = "block text-slate-600 dark:text-slate-300 mb-2";
const passwordMinLength = 12;
function SettingsSidebar({ sections, activeSection, onSelect }) {
  return (
    <aside className="self-start lg:sticky lg:top-24">
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/40">
        <nav aria-label="Settings sections" className="flex flex-col gap-1.5">
          {sections.map((section) => {
            const isActive = section.id === activeSection;
            return (
              <Button
                key={section.id}
                htmlType="button"
                aria-pressed={isActive}
                onClick={() => onSelect(section.id)}
                variant={isActive ? "primary" : "subtle"}
                color="standard"
                className="w-full justify-start rounded-xl text-base sm:text-base"
              >
                {section.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const loggedInUser = useAuth();
  const { refreshUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");

  const [username, setUsername] = useState("");
  const [usernameWarning, setUsernameWarning] = useState(null);
  const [profilePic, setProfilePic] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalProfilePic, setOriginalProfilePic] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailFieldWarning, setEmailFieldWarning] = useState(null);
  const [currentEmailPassword, setCurrentEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordWasBlurred, setNewPasswordWasBlurred] = useState(false);
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [emailMessage, setEmailMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [deletionMode, setDeletionMode] = useState(null);
  const [deletionStep, setDeletionStep] = useState("intro");
  const [deletionSaving, setDeletionSaving] = useState(false);
  const [deletionError, setDeletionError] = useState(null);
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionVerifying, setDeletionVerifying] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!loggedInUser) {
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/me");
      const body = await res.json();
      setProfile(body.user);
      const loadedUsername = body.user.user_data.username;
      const loadedPic = body.user.user_data.profile_pic || "";
      setUsername(loadedUsername);
      setProfilePic(loadedPic);
      setOriginalUsername(loadedUsername);
      setOriginalProfilePic(loadedPic);
      setNewEmail(loggedInUser.email);
      setLoading(false);
    } catch (err) {
      setProfileError("Failed to load profile");
      setLoading(false);
    }
  }, [loggedInUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!profile) return;
    if (profile.status === "pending_deletion") {
      return;
    }
    if (deletionStep === "confirm") {
      setDeletionStep("intro");
    }
  }, [profile, deletionStep, deletionMode]);

  const isAccountLocked = profile?.status === "pending_deletion";
  const previewInitial = (username.trim() || originalUsername || profile?.user_data?.username || "?").charAt(0).toUpperCase();
  const isNewPasswordTooShort = newPassword.length < passwordMinLength;
  const confirmPasswordMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const passwordLengthMessage = `Must be at least ${passwordMinLength} characters long`;
  const confirmPasswordMessage = "Passwords must match";
  const shouldShowNewPasswordMessage = isNewPasswordTooShort && (newPasswordWasBlurred || passwordSubmitAttempted);
  const newPasswordFieldError = passwordSubmitAttempted && shouldShowNewPasswordMessage
    ? passwordLengthMessage
    : undefined;
  const newPasswordFieldHelpText = !newPasswordFieldError && shouldShowNewPasswordMessage
    ? passwordLengthMessage
    : undefined;
  const confirmPasswordFieldError = passwordSubmitAttempted && confirmPasswordMismatch
    ? confirmPasswordMessage
    : undefined;
  const confirmPasswordFieldHelpText = !confirmPasswordFieldError && confirmPasswordMismatch
    ? confirmPasswordMessage
    : undefined;

  useEffect(() => {
    if (isAccountLocked && activeSection === "delete") {
      setActiveSection("profile");
    }
  }, [isAccountLocked, activeSection]);

  if (!loggedInUser) {
    return (
      <>
        <div
          className="fixed inset-0"
          style={{
            backgroundColor: "var(--opal-bg-color)",
            backgroundImage: "var(--opal-backdrop-image)"
          }}
        ></div>
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">Please log in...</p>
          </div>
        </div>
      </>
    );
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (isAccountLocked) return;
    setProfileError(null);
    setProfileSaving(true);

    const trimmedUsername = username.trim();

    try {
      const res = await apiFetch(`/users/${profile._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          profile_pic: profilePic
        })
      });

      if (res.status === 409) {
        setUsernameWarning("Username already taken.");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      setUsername(trimmedUsername);
      navigate(toProfileUrl(trimmedUsername));
      await loadProfile();
      await refreshUser();
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleUpdateEmail(e) {
    e.preventDefault();
    if (isAccountLocked) return;
    setEmailError(null);
    setEmailMessage(null);
    setEmailSaving(true);

    try {
      if (newEmail === loggedInUser.email) {
        setEmailError("This is already your current email");
        setEmailSaving(false);
        return;
      }
      if (!currentEmailPassword) {
        setEmailError("Please enter your current password to change email");
        setEmailSaving(false);
        return;
      }
      const credential = EmailAuthProvider.credential(
        loggedInUser.email,
        currentEmailPassword
      );
      await reauthenticateWithCredential(loggedInUser, credential);
      await updateEmail(loggedInUser, newEmail);
      setEmailMessage("Email updated successfully!");
      setCurrentEmailPassword("");
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setEmailError("Please log out and log back in before changing your email");
      } else if (err.code === 'auth/invalid-email') {
        setEmailError("Invalid email address");
      } else if (err.code === 'auth/email-already-in-use') {
        setEmailError("This email is already in use");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setEmailError("Current password is incorrect");
      } else {
        setEmailError(err.message || "Failed to update email");
      }
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (isAccountLocked) return;
    setPasswordError(null);
    setPasswordMessage(null);
    setPasswordSubmitAttempted(true);

    if (confirmPasswordMismatch) {
      return;
    }

    if (isNewPasswordTooShort) {
      return;
    }

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    setPasswordSaving(true);

    try {
      const credential = EmailAuthProvider.credential(
        loggedInUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(loggedInUser, credential);
      await updatePassword(loggedInUser, newPassword);
      setPasswordMessage("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setNewPasswordWasBlurred(false);
      setPasswordSubmitAttempted(false);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError("Current password is incorrect");
      } else if (err.code === 'auth/weak-password') {
        setPasswordError("Password is too weak. Please use a stronger password.");
      } else if (err.code === 'auth/too-many-requests') {
        setPasswordError("Too many failed attempts. Please try again later.");
      } else {
        setPasswordError(err.message || "Failed to update password");
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleChooseDeletion(mode) {
    setDeletionError(null);
    setDeletionSaving(true);
    try {
      await scheduleAccountDeletion(mode);
      setDeletionMode(mode);
      await refreshUser();
      navigate(toProfileUrl(profile?.user_data?.username), { replace: true });
    } catch (err) {
      setDeletionError(err.message || "Failed to schedule deletion");
    } finally {
      setDeletionSaving(false);
    }
  }

  async function handleVerifyDeletionPassword() {
    setDeletionError(null);
    setDeletionVerifying(true);
    try {
      const credential = EmailAuthProvider.credential(loggedInUser.email, deletionPassword);
      await reauthenticateWithCredential(loggedInUser, credential);
      setDeletionStep("choose");
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeletionError("Incorrect password.");
      } else if (err.code === 'auth/too-many-requests') {
        setDeletionError("Too many failed attempts. Please try again later.");
      } else {
        setDeletionError(err.message || "Verification failed.");
      }
    } finally {
      setDeletionVerifying(false);
    }
  }

  const deletionHeader = isAccountLocked
    ? "Account deletion scheduled"
    : deletionStep === "choose"
      ? "Delete all quizzes?"
      : "Delete Account";

  if (loading) {
    return (
      <>
        <div
          className="fixed inset-0"
          style={{
            backgroundColor: "var(--opal-bg-color)",
            backgroundImage: "var(--opal-backdrop-image)"
          }}
        ></div>
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">Loading settings...</p>
          </div>
        </div>
      </>
    );
  }

  const availableSections = isAccountLocked
    ? SETTINGS_SECTIONS.filter((section) => section.id !== "delete")
    : SETTINGS_SECTIONS;
  const currentSection = availableSections.some((section) => section.id === activeSection)
    ? activeSection
    : availableSections[0].id;

  let activePanel = null;

  if (currentSection === "profile") {
    activePanel = (
      <div className={panelClassName}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Profile Information</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Update your username and profile picture.
          </p>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Field
            label="Username"
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
            disabled={isAccountLocked}
            required
            labelClassName={labelClassName}
            inputClassName={inputClassName}
            error={usernameWarning}
            messageClassName="mt-0.5 pl-0.5"
          />
          <div>
            <label className={labelClassName}>Profile Picture URL</label>
            <div className="flex items-stretch gap-3">
              <UserAvatar
                userId={profile?._id || username || originalUsername}
                name={previewInitial}
                src={profilePic}
                size={44}
                shape="rounded"
                border
                borderClassName="border-slate-200/80"
                className="h-11 w-11 shrink-0 text-sm shadow-sm"
                textClassName="text-sm"
                alt="Profile picture"
              />
              <Field
                type="url"
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isAccountLocked}
                className="flex-1"
                inputClassName={`${inputClassName} h-[50px] py-0`}
              />
            </div>
          </div>
          <Button
            htmlType="submit"
            disabled={profileSaving || isAccountLocked || (username.trim() === originalUsername && profilePic === originalProfilePic)}
            variant="primary"
            color="standard"
            className="h-11 px-5"
          >
            {profileSaving ? "Saving..." : "Save Profile"}
          </Button>
          {profileError && <p className="mt-2 text-sm text-rose-600">{profileError}</p>}
        </form>
      </div>
    );
  }

  if (currentSection === "email") {
    activePanel = (
      <div className={panelClassName}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Email Address</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Change the email address linked to your account.
          </p>
        </div>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <Field
            label="New Email"
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailFieldWarning(null); }}
              onBlur={() => {
                if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                  setEmailFieldWarning("Please enter a valid email address.");
                }
              }}
              disabled={isAccountLocked}
              required
              labelClassName={labelClassName}
              inputClassName={inputClassName}
              error={emailFieldWarning}
              messageClassName="mt-0.5 pl-0.5"
            />
          <div>
            <label className={labelClassName}>Current Password (required for security)</label>
            <PasswordInput
              value={currentEmailPassword}
              onChange={(e) => setCurrentEmailPassword(e.target.value)}
              placeholder="Enter current password"
              disabled={isAccountLocked}
              required
              autoComplete="new-password"
              inputClassName={joinClasses(inputClassName, "pr-12")}
            />
          </div>
          <Button
            htmlType="submit"
            disabled={emailSaving || isAccountLocked || newEmail === loggedInUser?.email || !currentEmailPassword}
            variant="primary"
            color="standard"
            className="h-11 px-5"
          >
            {emailSaving ? "Updating..." : "Update Email"}
          </Button>
          {emailError && <p className="mt-2 text-sm text-rose-600">{emailError}</p>}
          {emailMessage && <p className="mt-2 text-sm text-emerald-600">{emailMessage}</p>}
        </form>
      </div>
    );
  }

  if (currentSection === "password") {
    activePanel = (
      <div className={panelClassName}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Change Password</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Use a strong password with at least 12 characters.
          </p>
        </div>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className={labelClassName}>Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              disabled={isAccountLocked}
              required
              inputClassName={joinClasses(inputClassName, "pr-20")}
            />
          </div>
          <div>
            <label className={labelClassName}>New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onBlur={() => setNewPasswordWasBlurred(true)}
              placeholder="Enter new password"
              disabled={isAccountLocked}
              minLength={passwordMinLength}
              helpText={newPasswordFieldHelpText}
              error={newPasswordFieldError}
              reserveMessageSpace
              messageClassName="mt-0.5 pl-0.5 min-h-[1.25rem]"
              inputClassName={joinClasses(inputClassName, "pr-20")}
            />
          </div>
          <div>
            <label className={labelClassName}>Confirm Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder="Confirm new password"
              disabled={isAccountLocked}
              minLength={passwordMinLength}
              helpText={confirmPasswordFieldHelpText}
              error={confirmPasswordFieldError}
              reserveMessageSpace
              messageClassName="mt-0.5 pl-0.5 min-h-[1.25rem]"
              inputClassName={joinClasses(inputClassName, "pr-20")}
            />
          </div>
          <Button
            htmlType="submit"
            disabled={passwordSaving || isAccountLocked || !currentPassword || !newPassword || !confirmPassword}
            variant="primary"
            color="standard"
            className="h-11 px-5"
          >
            {passwordSaving ? "Updating..." : "Change Password"}
          </Button>
          {passwordError && <p className="mt-2 text-sm text-rose-600">{passwordError}</p>}
          {passwordMessage && <p className="mt-2 text-sm text-emerald-600">{passwordMessage}</p>}
        </form>
      </div>
    );
  }

  if (currentSection === "delete" && !isAccountLocked) {
    activePanel = (
      <div className={panelClassName}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{deletionHeader}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Start account deletion, then choose whether your quizzes are removed or preserved.
            <br />
            You will then have 7 days to cancel if you change your mind, or delete immediately.
          </p>
        </div>
        {deletionStep === "intro" && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!deletionPassword || deletionVerifying) return;
              await handleVerifyDeletionPassword();
            }}
          >
            <div>
              <label className={labelClassName}>Current Password</label>
              <PasswordInput
                value={deletionPassword}
                onChange={(e) => setDeletionPassword(e.target.value)}
                placeholder="Enter current password"
                inputClassName={joinClasses(inputClassName, "pr-20")}
              />
              <p className={`text-xs mt-0.5 pl-0.5 min-h-[1.25rem] ${deletionError ? 'text-rose-500' : 'text-transparent'}`}>
                {deletionError || '\u00A0'}
              </p>
            </div>
            <Button
              htmlType="submit"
              disabled={!deletionPassword || deletionVerifying}
              variant="primary"
              color="red"
              className="h-11 px-5"
            >
              {deletionVerifying ? "Verifying..." : "Continue"}
            </Button>
          </form>
        )}
        {deletionError && deletionStep === "choose" && (
          <p className="mt-2 text-sm text-rose-600">{deletionError}</p>
        )}
        {deletionStep === "choose" && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              You can delete all quizzes you created (this removes other users&apos; attempt history
              on those quizzes), or preserve your quizzes and anonymise your authorship as
              deleted user.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                htmlType="button"
                onClick={() => { setDeletionStep("intro"); setDeletionPassword(""); setDeletionError(null); }}
                disabled={deletionSaving}
                variant="secondary"
                color="standard"
                className="h-11 px-5"
              >
                Cancel
              </Button>
              <Button
                htmlType="button"
                onClick={() => handleChooseDeletion("delete_quizzes")}
                disabled={deletionSaving}
                variant="primary"
                color="red"
                className="h-11 px-5"
              >
                Delete My Quizzes
              </Button>
              <Button
                htmlType="button"
                onClick={() => handleChooseDeletion("preserve_quizzes")}
                disabled={deletionSaving}
                variant="primary"
                color="standard"
                className="h-11 px-5"
              >
                Preserve My Quizzes
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <PageShell mainClassName="max-w-5xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and profile preferences"
      />
      {isAccountLocked && (
        <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-100/70 p-4 backdrop-blur">
          <p className="text-amber-700">Your account is scheduled for deletion. Manage the countdown from your profile.</p>
          <div className="mt-4">
            <Button
              htmlType="button"
              onClick={() => navigate(toProfileUrl(profile?.user_data?.username))}
              variant="secondary"
              color="standard"
              className="h-11 px-5"
            >
              Go to My Profile
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <SettingsSidebar
          sections={availableSections}
          activeSection={currentSection}
          onSelect={setActiveSection}
        />
        {activePanel}
      </div>
    </PageShell>
  );
}
