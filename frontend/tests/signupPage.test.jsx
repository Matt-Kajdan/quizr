import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  onAuthStateChangedMock,
  fetchMock,
  refreshUserMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signupMock: vi.fn(),
  apiFetchMock: vi.fn(),
  setSigningUpMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(() => vi.fn()),
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

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: onAuthStateChangedMock,
}));

vi.mock("@shared/auth/firebase", () => ({
  auth: {},
}));

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
    <MemoryRouter>
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
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText("Username"), "quizr-user");
    await user.type(screen.getByLabelText("Email"), "quizr@example.com");
    await user.type(screen.getByLabelText("Password"), "very-long-pass");
    await user.type(screen.getByLabelText("Confirm Password"), "very-long-pass");
    await user.click(screen.getByDisplayValue("Sign up"));

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

  it("blocks submission when passwords do not match", async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText("Username"), "quizr-user");
    await user.type(screen.getByLabelText("Email"), "quizr@example.com");
    await user.type(screen.getByLabelText("Password"), "very-long-pass");
    await user.type(screen.getByLabelText("Confirm Password"), "different-pass");
    await user.click(screen.getByDisplayValue("Sign up"));

    expect(screen.getAllByText(/passwords do not match/i).length).toBeGreaterThan(0);
    expect(signupMock).not.toHaveBeenCalled();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
