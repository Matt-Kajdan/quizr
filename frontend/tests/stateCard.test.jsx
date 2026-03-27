import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StateCard } from "@shared/components/StateCard";

describe("StateCard", () => {
  it("renders no-results content with an optional primary action", () => {
    const onAction = vi.fn();

    render(
      <StateCard
        variant="no-results"
        tone="search"
        title="No results found"
        description="Try changing the filters."
        actionLabel="Clear search"
        onAction={onAction}
      />
    );

    expect(screen.getByText("No results found")).toBeTruthy();
    expect(screen.getByText("Try changing the filters.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders fullscreen error states as alerts", () => {
    render(
      <StateCard
        mode="fullscreen"
        backdrop="opal"
        variant="error"
        tone="danger"
        title="Error"
        description="Something went wrong."
      />
    );

    const alert = screen.getByRole("alert");

    expect(alert.textContent).toContain("Error");
    expect(alert.textContent).toContain("Something went wrong.");
  });
});
