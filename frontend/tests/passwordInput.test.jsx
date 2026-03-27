import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "@shared/components/PasswordInput";

describe("PasswordInput", () => {
  it("does not show a character counter when minLength is provided without opt-in", () => {
    render(
      <PasswordInput
        label="Password"
        value="secret"
        onChange={() => {}}
        minLength={12}
      />
    );

    expect(screen.queryByText(/^6$/)).toBeNull();
  });

  it("shows a character counter only when explicitly enabled", () => {
    render(
      <PasswordInput
        label="Password"
        value="secret"
        onChange={() => {}}
        minLength={12}
        showCharacterCount
      />
    );

    expect(screen.getByText(/^6$/)).toBeTruthy();
  });
});
