import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeContext } from "@shared/state/ThemeContext";
import { Login } from "@features/auth/pages/Login";

const {
  loginMock,
  forgotPasswordMock,
} = vi.hoisted(() => ({
  loginMock: vi.fn(),
  forgotPasswordMock: vi.fn(),
}));

vi.mock("@shared/auth/authService", () => ({
  login: loginMock,
  forgotPassword: forgotPasswordMock,
}));

function renderLogin() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeContext.Provider value={{ theme: "light", toggleTheme: vi.fn() }}>
        <Login />
      </ThemeContext.Provider>
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockResolvedValue(undefined);
    forgotPasswordMock.mockResolvedValue(undefined);
  });

  it("submits email/password credentials through the auth service", async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText("Email or username"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "very-secret" },
    });
    fireEvent.click(screen.getByDisplayValue("Log in"));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("user@example.com", "very-secret");
    });
  });

  it("switches to forgot-password mode and sends a reset request", async () => {
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByDisplayValue("Send reset link"));

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith("user@example.com");
    });
    expect(
      await screen.findByText(/if an account with that email exists/i)
    ).toBeTruthy();
  });
});
