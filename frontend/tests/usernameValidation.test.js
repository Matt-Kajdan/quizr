import { describe, expect, it } from "vitest";
import {
  formatUsernameInput,
  fromProfileUrl,
  toProfileUrl,
  trimTrailingSpace,
} from "@shared/utils/usernameValidation";

describe("usernameValidation", () => {
  it("strips invalid characters and leading spaces", () => {
    expect(formatUsernameInput("  ab!c? d")).toEqual({
      value: "abc d",
      warning: "Only letters, numbers, dashes (-), dots (.), and spaces are allowed.",
    });
  });

  it("removes a trailing space on blur", () => {
    expect(trimTrailingSpace("Quizr User ")).toEqual({
      value: "Quizr User",
      warning: "Trailing space was removed.",
    });
  });

  it("maps usernames to and from profile URLs", () => {
    expect(toProfileUrl("Quizr User")).toBe("/users/Quizr_User");
    expect(fromProfileUrl("Quizr_User")).toBe("Quizr User");
  });
});
