import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavBar from "@app/NavBar";

vi.mock("@shared/auth/authService", () => ({
  logout: vi.fn(),
}));

vi.mock("@shared/auth/useAuth", () => ({
  useAuth: () => ({ uid: "user-1" }),
}));

vi.mock("@shared/state/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@features/users/components/UserSearchBar", () => ({
  default: () => <div data-testid="user-search-bar">search</div>,
}));

function createMatchMediaMock(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set();

  return {
    matchMedia: vi.fn(() => ({
      get matches() {
        return matches;
      },
      media: "(max-width: 639px)",
      onchange: null,
      addEventListener: (_event, listener) => listeners.add(listener),
      removeEventListener: (_event, listener) => listeners.delete(listener),
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      dispatchEvent: vi.fn(),
    })),
    setMatches(nextMatches) {
      matches = nextMatches;
      listeners.forEach((listener) => listener({ matches }));
    },
  };
}

function setViewport(width, height) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });
}

describe("NavBar mobile mode", () => {
  beforeEach(() => {
    const matchMediaController = createMatchMediaMock(false);
    window.matchMedia = matchMediaController.matchMedia;
    setViewport(900, 1200);
  });

  it("renders the mobile nav path for a wide portrait viewport", async () => {
    render(
      <MemoryRouter
        initialEntries={["/"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NavBar accountStatus="active" accountUsername="matt" />
      </MemoryRouter>
    );

    expect(await screen.findByText("Search")).toBeTruthy();
    expect(screen.queryByText("Sign out")).toBeNull();
    expect(screen.queryByTestId("user-search-bar")).toBeNull();
  });
});
