import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@shared/components/PageHeader";

describe("PageHeader", () => {
  it("renders the title and subtitle", () => {
    render(<PageHeader title="Leaderboard" subtitle="All quizzes combined" />);

    expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeTruthy();
    expect(screen.getByText("All quizzes combined")).toBeTruthy();
  });

  it("keeps the reserved subtitle slot when no subtitle is provided", () => {
    const { container } = render(<PageHeader title="Settings" />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
    expect(container.querySelector(".min-h-\\[1\\.5rem\\]")).toBeTruthy();
  });

  it("accepts subtitle class overrides for page-specific behavior", () => {
    render(
      <PageHeader
        title="Quiz"
        subtitle="Ready to play"
        subtitleClassName="opacity-0"
      />
    );

    expect(screen.getByText("Ready to play").className.includes("opacity-0")).toBe(true);
  });

  it("keeps the title on the default page type styling", () => {
    render(<PageHeader title="Friends" subtitle="Connect and compete" />);

    const heading = screen.getByRole("heading", { name: "Friends" });
    const subtitle = screen.getByText("Connect and compete");

    expect(heading.getAttribute("style")).toBeNull();
    expect(subtitle.getAttribute("style")).toBeNull();
  });
});
