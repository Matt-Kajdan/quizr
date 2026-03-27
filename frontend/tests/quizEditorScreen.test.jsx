import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuizEditorScreen } from "@features/quizzes/components/quizeditor/QuizEditorScreen";
import {
  ANSWER_COUNT_OPTIONS,
  QUIZ_EDITOR_CATEGORIES,
  QUIZ_EDITOR_DIFFICULTY_OPTIONS,
} from "@features/quizzes/components/quizeditor/quizEditorConfig";

function buildProps(overrides = {}) {
  return {
    isMobile: false,
    pageTitle: "Create New Quiz",
    pageSubtitle: "Design your own quiz",
    title: "Space Facts",
    onTitleChange: vi.fn(),
    category: "science",
    onCategoryChange: vi.fn(),
    categories: QUIZ_EDITOR_CATEGORIES,
    answersPerQuestion: 4,
    answerCountOptions: ANSWER_COUNT_OPTIONS,
    onAnswersPerQuestionChange: vi.fn(),
    difficulty: "medium",
    difficultyOptions: QUIZ_EDITOR_DIFFICULTY_OPTIONS,
    onDifficultyChange: vi.fn(),
    passLabel: "1/1 (100%)",
    reqToPass: 1,
    questionCount: 1,
    onReqToPassChange: vi.fn(),
    allowMultipleCorrect: false,
    onAllowMultipleCorrectChange: vi.fn(),
    requireAllCorrect: false,
    onRequireAllCorrectChange: vi.fn(),
    lockAnswers: false,
    onLockAnswersChange: vi.fn(),
    randomQuestionOrder: false,
    onRandomQuestionOrderChange: vi.fn(),
    onCancel: vi.fn(),
    onAddQuestion: vi.fn(),
    onSubmit: vi.fn(),
    onSignOut: vi.fn(),
    cancelLabelMobile: "Cancel",
    cancelLabelDesktop: "Cancel",
    submitLabelMobile: "Create",
    submitLabelDesktop: "Create Quiz",
    submitDisabled: false,
    showQuestionActions: true,
    isQuestionDragging: false,
    children: <div>Question list slot</div>,
    ...overrides,
  };
}

describe("QuizEditorScreen", () => {
  it("renders the shared create shell and question list slot", () => {
    render(<QuizEditorScreen {...buildProps()} />);

    expect(screen.getByRole("heading", { name: "Create New Quiz" })).toBeTruthy();
    expect(screen.getByDisplayValue("Space Facts")).toBeTruthy();
    expect(screen.getByText("Question list slot")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create Quiz" })).toBeTruthy();
  });

  it("renders edit warnings and disabled submit state from controller props", () => {
    render(
      <QuizEditorScreen
        {...buildProps({
          pageTitle: "Edit Quiz",
          pageSubtitle: "Refine your quiz details",
          cancelLabelDesktop: "Discard Changes",
          submitLabelDesktop: "Save Changes",
          submitDisabled: true,
          desktopWarning: <div>Saving changes will reset attempts.</div>,
        })}
      />
    );

    expect(screen.getByRole("heading", { name: "Edit Quiz" })).toBeTruthy();
    expect(screen.getByText("Saving changes will reset attempts.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Changes" }).hasAttribute("disabled")).toBe(true);
  });
});
