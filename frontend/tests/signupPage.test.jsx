import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Signup } from "@features/auth/pages/Signup";
import { ThemeContext } from "@shared/state/ThemeContext";
import { UserContext } from "@shared/state/UserContext";

const {
  navigateMock,
  signupMock,
  apiFetchMock,
  setSigningUpMock,
  fetchMock,
  refreshUserMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signupMock: vi.fn(),
  apiFetchMock: vi.fn(),
  setSigningUpMock: vi.fn(),
  fetchMock: vi.fn(),
  refreshUserMock: vi.fn(),
}));

vi.stubGlobal("fetch", fetchMock);

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@shared/auth/authService", () => ({
  signup: signupMock,
}));

vi.mock("@shared/api/apiClient", () => ({
  apiFetch: apiFetchMock,
}));

vi.mock("@shared/auth/signupGate", () => ({
  setSigningUp: setSigningUpMock,
}));

function renderSignup() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeContext.Provider value={{ theme: "light", toggleTheme: vi.fn() }}>
        <UserContext.Provider
          value={{
            userProfile: null,
            favouriteIds: [],
            setFavouriteIds: vi.fn(),
            accountStatus: null,
            accountUsername: null,
            currentUserId: null,
            refreshUser: refreshUserMock,
            isLoading: false,
          }}
        >
          <Signup />
        </UserContext.Provider>
      </ThemeContext.Provider>
    </MemoryRouter>
  );
}

describe("Signup page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("requestAnimationFrame", (callback) => callback(0));
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ available: true }),
    });
    signupMock.mockResolvedValue("signup-token");
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { username: "quizr-user" } }),
    });
  });

  it("creates the Firebase account and then the app user record", async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "quizr-user", selectionStart: 10 },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "quizr@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "very-long-pass" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "very-long-pass" },
    });
    fireEvent.click(screen.getByDisplayValue("Sign up"));

    await waitFor(() => {
      expect(fetchMock.mock.calls[0][0]).toBe(
        "http://localhost:3000/api/users/availability?username=quizr-user"
      );
      expect(signupMock).toHaveBeenCalledWith(
        "quizr@example.com",
        "very-long-pass"
      );
      expect(apiFetchMock).toHaveBeenCalledWith("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "quizr-user" }),
      });
      expect(refreshUserMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("blocks submission when passwords do not match", async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "quizr-user", selectionStart: 10 },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "quizr@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "very-long-pass" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "different-pass" },
    });
    fireEvent.click(screen.getByDisplayValue("Sign up"));

    await waitFor(() => {
      expect(
        screen.getAllByText(/passwords must match/i).length
      ).toBeGreaterThan(0);
    });
    expect(signupMock).not.toHaveBeenCalled();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("shows the confirm-password hint live and clears it when the passwords match", () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "d" },
    });

    expect(screen.getByText("Passwords must match")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "d" },
    });

    expect(screen.queryByText("Passwords must match")).toBeNull();
  });

  it("shows the password length hint only after blur and hides it once long enough", () => {
    renderSignup();

    expect(screen.queryByText("Must be at least 12 characters long")).toBeNull();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short" },
    });
    expect(screen.queryByText("Must be at least 12 characters long")).toBeNull();

    fireEvent.blur(screen.getByLabelText("Password"));
    expect(screen.getByText("Must be at least 12 characters long")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "very-long-pass" },
    });
    expect(screen.queryByText("Must be at least 12 characters long")).toBeNull();
  });

  it("turns visible password helper messages red after submit until the values are fixed", async () => {
    renderSignup();

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "quizr-user", selectionStart: 10 },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "quizr@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short" },
    });
    fireEvent.blur(screen.getByLabelText("Password"));
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "different" },
    });

    const passwordHint = screen.getByText("Must be at least 12 characters long");
    const mismatchHint = screen.getByText("Passwords must match");

    expect(passwordHint.className).not.toContain("text-rose-500");
    expect(mismatchHint.className).not.toContain("text-rose-500");

    fireEvent.click(screen.getByDisplayValue("Sign up"));

    await waitFor(() => {
      expect(screen.getByText("Must be at least 12 characters long").className).toContain("text-rose-500");
      expect(screen.getByText("Passwords must match").className).toContain("text-rose-500");
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "very-long-pass" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "very-long-pass" },
    });

    expect(screen.queryByText("Must be at least 12 characters long")).toBeNull();
    expect(screen.queryByText("Passwords must match")).toBeNull();
  });
});
