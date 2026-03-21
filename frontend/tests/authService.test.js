import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithEmailAndPassword = vi.fn();
const createUserWithEmailAndPassword = vi.fn();
const sendPasswordResetEmail = vi.fn();
const signOut = vi.fn();
const getIdToken = vi.fn();

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
}));

vi.mock("@shared/auth/firebase", () => ({
  auth: {
    currentUser: null,
    signOut,
  },
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in with Firebase auth and returns an ID token", async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { getIdToken },
    });
    getIdToken.mockResolvedValue("token-123");

    const { login } = await import("@shared/auth/authService");
    const token = await login("user@example.com", "secret-password");

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      "user@example.com",
      "secret-password"
    );
    expect(token).toBe("token-123");
  });

  it("signs up with Firebase auth and returns an ID token", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { getIdToken },
    });
    getIdToken.mockResolvedValue("signup-token");

    const { signup } = await import("@shared/auth/authService");
    const token = await signup("new@example.com", "long-password");

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      "new@example.com",
      "long-password"
    );
    expect(token).toBe("signup-token");
  });

  it("forwards forgot-password requests to Firebase auth", async () => {
    const { forgotPassword } = await import("@shared/auth/authService");

    await forgotPassword("forgot@example.com");

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.any(Object),
      "forgot@example.com"
    );
  });
});
