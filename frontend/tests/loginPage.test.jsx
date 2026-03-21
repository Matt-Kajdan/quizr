import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeContext } from "@shared/state/ThemeContext";
import { Login } from "@features/auth/pages/Login";

const {
  navigateMock,
  loginMock,
  forgotPasswordMock,
  onAuthStateChangedMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  loginMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(() => vi.fn()),
}));

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
  login: loginMock,
  forgotPassword: forgotPasswordMock,
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <ThemeContext.Provider value={{ theme: "light", toggleTheme: vi.fn() }}>
        <Login />
      </ThemeContext.Provider>
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits email/password credentials through the auth service", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Email or username"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "very-secret");
    await user.click(screen.getByDisplayValue("Log in"));

    expect(loginMock).toHaveBeenCalledWith("user@example.com", "very-secret");
  });

  it("switches to forgot-password mode and sends a reset request", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /forgot password/i }));
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByDisplayValue("Send reset link"));

    expect(forgotPasswordMock).toHaveBeenCalledWith("user@example.com");
    expect(screen.getByText(/if an account with that email exists/i)).toBeTruthy();
  });
});
