import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchField } from "@shared/components/SearchField";

describe("SearchField", () => {
  it("shows a clear button only when the field has a value", () => {
    const { rerender } = render(<SearchField value="" onChange={() => {}} onClear={() => {}} />);

    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();

    rerender(<SearchField value="quiz" onChange={() => {}} onClear={() => {}} />);

    expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy();
  });

  it("calls onClear when the clear button is clicked", () => {
    const onClear = vi.fn();

    render(<SearchField value="quiz" onChange={() => {}} onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("blurs and notifies on escape", () => {
    const onEscape = vi.fn();

    render(<SearchField value="quiz" onChange={() => {}} onEscape={onEscape} placeholder="Search quizzes" />);

    const input = screen.getByPlaceholderText("Search quizzes");
    input.focus();

    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: "Escape" });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(input);
  });
});
