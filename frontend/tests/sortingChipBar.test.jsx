import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SortingChipBar } from "@shared/components/SortingChipBar";

const chips = [
  { value: "date", label: "Newest", reverseLabel: "Oldest" },
  { value: "stars", label: "Likes" },
];

describe("SortingChipBar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all chips and marks the active one as pressed", () => {
    render(
      <SortingChipBar
        chips={chips}
        activeValue="date"
        direction="desc"
        onChipClick={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Newest" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Likes" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("shows the reverse label only for the active ascending chip", () => {
    render(
      <SortingChipBar
        chips={chips}
        activeValue="date"
        direction="asc"
        onChipClick={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Oldest" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Newest" })).toBeNull();
    expect(screen.getByRole("button", { name: "Likes" })).toBeTruthy();
  });

  it("shows the direction arrow only on the active chip", () => {
    const { container } = render(
      <SortingChipBar
        chips={chips}
        activeValue="stars"
        direction="desc"
        onChipClick={vi.fn()}
      />
    );

    const newestButton = screen.getByRole("button", { name: "Newest" });
    const likesButton = screen.getByRole("button", { name: "Likes" });

    expect(newestButton.querySelector("svg")).toBeNull();
    expect(likesButton.querySelector("svg")).toBeTruthy();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("calls onChipClick with the clicked chip value", () => {
    const onChipClick = vi.fn();

    render(
      <SortingChipBar
        chips={chips}
        activeValue="date"
        direction="desc"
        onChipClick={onChipClick}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Likes" }));

    expect(onChipClick).toHaveBeenCalledWith("stars");
  });

  it("disables all chips when the bar is disabled", () => {
    render(
      <SortingChipBar
        chips={chips}
        activeValue="date"
        direction="desc"
        disabled
        onChipClick={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Newest" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Likes" }).hasAttribute("disabled")).toBe(true);
  });

  it("can opt into mobile fill behavior without changing desktop defaults", () => {
    render(
      <SortingChipBar
        chips={chips}
        activeValue="date"
        direction="desc"
        fillMobile
        onChipClick={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Newest" }).className.includes("grow")).toBe(true);
    expect(screen.getByRole("button", { name: "Newest" }).className.includes("sm:grow-0")).toBe(true);
  });

  it("shows mobile fade only when the chip row actually overflows", async () => {
    const scrollWidthSpy = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get");
    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get");

    scrollWidthSpy.mockReturnValue(320);
    clientWidthSpy.mockReturnValue(320);

    const { container, rerender } = render(
      <SortingChipBar
        chips={chips}
        activeValue="date"
        direction="desc"
        showMobileFade
        onChipClick={vi.fn()}
      />
    );

    expect(container.querySelectorAll(".bg-gradient-to-l")).toHaveLength(0);
    expect(container.querySelectorAll(".bg-gradient-to-r")).toHaveLength(0);

    scrollWidthSpy.mockReturnValue(420);
    clientWidthSpy.mockReturnValue(320);

    rerender(
      <SortingChipBar
        chips={chips}
        activeValue="stars"
        direction="desc"
        showMobileFade
        onChipClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(container.querySelectorAll(".bg-gradient-to-l")).toHaveLength(1);
      expect(container.querySelectorAll(".bg-gradient-to-r")).toHaveLength(1);
    });
  });
});
