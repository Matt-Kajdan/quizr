import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@features/users/pages/SettingsPage";

const {
  navigateMock,
  apiFetchMock,
  refreshUserMock,
  updatePasswordMock,
  updateEmailMock,
  reauthenticateWithCredentialMock,
  credentialMock,
  loggedInUser,
  scheduleAccountDeletionMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  apiFetchMock: vi.fn(),
  refreshUserMock: vi.fn(),
  updatePasswordMock: vi.fn(),
  updateEmailMock: vi.fn(),
  reauthenticateWithCredentialMock: vi.fn(),
  credentialMock: vi.fn(() => ({ token: "credential" })),
  loggedInUser: { email: "quizr@example.com" },
  scheduleAccountDeletionMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@shared/api/apiClient", () => ({
  apiFetch: apiFetchMock,
}));

vi.mock("@shared/auth/useAuth", () => ({
  useAuth: () => loggedInUser,
}));

vi.mock("@shared/state/useUser", () => ({
  useUser: () => ({
    refreshUser: refreshUserMock,
  }),
}));

vi.mock("@features/users/api/users", () => ({
  scheduleAccountDeletion: scheduleAccountDeletionMock,
}));

vi.mock("firebase/auth", () => ({
  updatePassword: updatePasswordMock,
  updateEmail: updateEmailMock,
  reauthenticateWithCredential: reauthenticateWithCredentialMock,
  EmailAuthProvider: {
    credential: credentialMock,
  },
}));

function renderSettings() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SettingsPage />
    </MemoryRouter>
  );
}

describe("Settings password form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          _id: "user-1",
          status: "active",
          user_data: {
            username: "quizr-user",
            profile_pic: "",
          },
        },
      }),
    });
  });

  it("shows live mismatch and blur-triggered length hints without trailing counters", async () => {
    renderSettings();

    fireEvent.click(await screen.findByRole("button", { name: "Password" }));

    const currentPasswordField = screen.getByPlaceholderText("Enter current password");
    const newPasswordField = screen.getByPlaceholderText("Enter new password");
    const confirmPasswordField = screen.getByPlaceholderText("Confirm new password");

    fireEvent.change(newPasswordField, {
      target: { value: "secret" },
    });
    expect(screen.queryByText("Must be at least 12 characters long")).toBeNull();
    expect(screen.queryByText(/^6$/)).toBeNull();

    fireEvent.blur(newPasswordField);
    const passwordHint = screen.getByText("Must be at least 12 characters long");
    expect(passwordHint.className).not.toContain("text-rose-500");

    fireEvent.change(confirmPasswordField, {
      target: { value: "secrex" },
    });
    const mismatchHint = screen.getByText("Passwords must match");
    expect(mismatchHint.className).not.toContain("text-rose-500");
    expect(screen.queryByText(/^6$/)).toBeNull();

    fireEvent.change(currentPasswordField, {
      target: { value: "current-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

    await waitFor(() => {
      expect(screen.getByText("Must be at least 12 characters long").className).toContain("text-rose-500");
      expect(screen.getByText("Passwords must match").className).toContain("text-rose-500");
    });

    fireEvent.change(newPasswordField, {
      target: { value: "very-long-pass" },
    });
    fireEvent.change(confirmPasswordField, {
      target: { value: "very-long-pass" },
    });

    expect(screen.queryByText("Must be at least 12 characters long")).toBeNull();
    expect(screen.queryByText("Passwords must match")).toBeNull();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });
});
