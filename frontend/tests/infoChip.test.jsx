import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InfoChip } from "@shared/components/InfoChip";

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l2.7 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.9 6.5 20.4l1.1-6.3L3 9.6l6.3-.9L12 3Z" />
    </svg>
  );
}

describe("InfoChip", () => {
  it("renders passive chips as spans without interactive classes", () => {
    const { container } = render(
      <InfoChip variant="secondary" color="slate">
        Questions
      </InfoChip>
    );

    const chip = container.querySelector("span");

    expect(screen.queryByRole("button", { name: "Questions" })).toBeNull();
    expect(chip.className.includes("cursor-default")).toBe(true);
    expect(chip.className.includes("hover:")).toBe(false);
  });

  it("renders clickable chips as buttons with hover treatment and no scale transform", () => {
    render(
      <InfoChip onClick={vi.fn()} variant="subtle" color="slate">
        Created by Jane
      </InfoChip>
    );

    const chip = screen.getByRole("button", { name: "Created by Jane" });

    expect(chip.className.includes("hover:bg-slate-100/80")).toBe(true);
    expect(chip.className.includes("scale")).toBe(false);
  });

  it("renders icon and label content together", () => {
    const { container } = render(
      <InfoChip icon={<StarIcon />} variant="primary" color="amber">
        5
      </InfoChip>
    );

    expect(screen.getByText("5")).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("applies size-specific classes", () => {
    render(
      <>
        <InfoChip size="sm">Small</InfoChip>
        <InfoChip size="md">Medium</InfoChip>
      </>
    );

    expect(screen.getByText("Small").parentElement.className.includes("min-h-7")).toBe(true);
    expect(screen.getByText("Medium").parentElement.className.includes("min-h-8")).toBe(true);
  });

  it("requires ariaLabel for clickable icon-only chips", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(() => render(<InfoChip onClick={() => {}} icon={<StarIcon />} />)).toThrow(
        "Clickable icon-only info chips require ariaLabel."
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
