import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterChipGroup } from "@shared/components/FilterChipGroup";

const chips = [
  { value: "all", label: "All" },
  { value: "correct", label: "Correct" },
  { value: "wrong", label: "Incorrect" },
];

describe("FilterChipGroup", () => {
  it("renders chips and marks the selected value as pressed", () => {
    render(
      <FilterChipGroup
        chips={chips}
        selectedValue="correct"
        onChipClick={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Correct" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onChipClick with the selected value", () => {
    const onChipClick = vi.fn();

    render(
      <FilterChipGroup
        chips={chips}
        selectedValue="all"
        onChipClick={onChipClick}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Incorrect" }));

    expect(onChipClick).toHaveBeenCalledWith("wrong");
  });

  it("disables all chips when the group is disabled", () => {
    render(
      <FilterChipGroup
        chips={chips}
        selectedValue="all"
        disabled
        onChipClick={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "All" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Correct" }).hasAttribute("disabled")).toBe(true);
  });

  it("renders multiple chips inside a labelled group", () => {
    render(
      <FilterChipGroup
        chips={chips}
        selectedValue="all"
        ariaLabel="Answer filters"
        onChipClick={vi.fn()}
      />
    );

    expect(screen.getByRole("group", { name: "Answer filters" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});
