import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Button } from "@shared/components/Button";

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l2.7 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.9 6.5 20.4l1.1-6.3L3 9.6l6.3-.9L12 3Z" />
    </svg>
  );
}

describe("Button", () => {
  it("renders a clickable button with icon before text", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button onClick={onClick} variant="primary" color="standard" icon={<StarIcon />}>
        Save
      </Button>
    );

    const button = screen.getByRole("button", { name: "Save" });
    const icon = container.querySelector("svg");

    expect(button).toBeTruthy();
    expect(icon).toBeTruthy();
    expect(button.textContent).toBe("Save");
  });

  it("renders router navigation as a link", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Button to="/settings" variant="secondary" color="standard">
          Settings
        </Button>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/settings");
  });

  it("renders anchors when href is provided", () => {
    render(
      <Button href="/docs" variant="subtle" color="amber">
        Docs
      </Button>
    );

    expect(screen.getByRole("link", { name: "Docs" }).getAttribute("href")).toBe("/docs");
  });

  it("uses disabled styling with a normal cursor", () => {
    render(
      <Button disabled variant="secondary" color="red">
        Delete
      </Button>
    );

    const button = screen.getByRole("button", { name: "Delete" });

    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.className.includes("cursor-default")).toBe(true);
  });

  it("requires ariaLabel for icon-only buttons", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(() => render(<Button onClick={() => {}} icon={<StarIcon />} />)).toThrow(
        "Icon-only buttons require ariaLabel."
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("rejects mixed navigation and click targets", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(() =>
        render(
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Button onClick={() => {}} to="/settings">
              Settings
            </Button>
          </MemoryRouter>
        )
      ).toThrow("Button accepts only one of onClick, to, or href.");
    } finally {
      errorSpy.mockRestore();
    }
  });
});
