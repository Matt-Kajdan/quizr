import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@shared/hooks/useIsMobile";

function HookProbe() {
  const isMobile = useIsMobile();

  return <div>{isMobile ? "mobile" : "desktop"}</div>;
}

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

describe("useIsMobile", () => {
  let matchMediaController;
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    matchMediaController = createMatchMediaMock(false);
    window.matchMedia = matchMediaController.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns mobile when the width breakpoint matches in landscape", async () => {
    setViewport(500, 300);
    matchMediaController.setMatches(true);

    render(<HookProbe />);

    expect(await screen.findByText("mobile")).toBeTruthy();
  });

  it("returns mobile for a portrait viewport even when the width breakpoint does not match", async () => {
    setViewport(900, 1200);

    render(<HookProbe />);

    expect(await screen.findByText("mobile")).toBeTruthy();
  });

  it("returns desktop for a landscape viewport above the width breakpoint", async () => {
    setViewport(1200, 900);

    render(<HookProbe />);

    expect(await screen.findByText("desktop")).toBeTruthy();
  });

  it("returns desktop for a square viewport above the width breakpoint", async () => {
    setViewport(1000, 1000);

    render(<HookProbe />);

    expect(await screen.findByText("desktop")).toBeTruthy();
  });

  it("updates from desktop to mobile when the viewport resizes from landscape to portrait", async () => {
    setViewport(1200, 900);

    render(<HookProbe />);
    expect(await screen.findByText("desktop")).toBeTruthy();

    setViewport(900, 1200);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(screen.getByText("mobile")).toBeTruthy();
    });
  });

  it("updates from mobile to desktop when the viewport resizes from portrait to landscape", async () => {
    setViewport(900, 1200);

    render(<HookProbe />);
    expect(await screen.findByText("mobile")).toBeTruthy();

    setViewport(1200, 900);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(screen.getByText("desktop")).toBeTruthy();
    });
  });
});
