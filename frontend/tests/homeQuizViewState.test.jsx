import { describe, expect, it } from "vitest";
import {
  getHomeQuizViewState,
  getQuizSearchMatchReasons
} from "@features/quizzes/utils/homeQuizViewState";

const quizzes = [
  {
    _id: "quiz-1",
    title: "Math Basics",
    category: "science",
    created_at: "2024-01-10T00:00:00.000Z",
    created_by: { user_data: { username: "alice" } },
    questions: [{ id: 1 }, { id: 2 }],
    favourited_count: 2,
    difficulty: "easy"
  },
  {
    _id: "quiz-2",
    title: "History of Rome",
    category: "history",
    created_at: "2024-02-10T00:00:00.000Z",
    created_by: { user_data: { username: "bruno" } },
    questions: [{ id: 1 }],
    favourited_count: 5,
    difficulty: "hard"
  },
  {
    _id: "quiz-3",
    title: "Art by Alice",
    category: "art",
    created_at: "2024-03-10T00:00:00.000Z",
    created_by: { user_data: { username: "alice" } },
    questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
    favourited_count: 1,
    difficulty: "medium"
  }
];

function getState(overrides = {}) {
  return getHomeQuizViewState({
    quizzes,
    selectedCategory: "all",
    favouriteIds: ["quiz-2"],
    accountUsername: "alice",
    sortBy: "newest",
    sortDirection: "desc",
    searchQuery: "",
    ...overrides
  });
}

describe("home quiz view state", () => {
  it("returns the normal category-filtered and sorted list when search is empty", () => {
    const state = getState();

    expect(state.visibleQuizzes.map((quiz) => quiz._id)).toEqual(["quiz-3", "quiz-2", "quiz-1"]);
    expect(state.hasSearchMatches).toBe(false);
    expect(state.showSearchEmptyState).toBe(false);
  });

  it("matches title, category, and author fields case-insensitively", () => {
    expect(getQuizSearchMatchReasons(quizzes[0], "math")).toEqual(["title"]);
    expect(getQuizSearchMatchReasons(quizzes[0], "SCIENCE")).toEqual(["category"]);
    expect(getQuizSearchMatchReasons(quizzes[2], "alice")).toEqual(["title", "author"]);
  });

  it("narrows the list and records match reasons when search has hits", () => {
    const state = getState({ searchQuery: "history" });

    expect(state.visibleQuizzes.map((quiz) => quiz._id)).toEqual(["quiz-2"]);
    expect(state.hasSearchMatches).toBe(true);
    expect(state.matchReasonsById["quiz-2"]).toEqual(["title", "category"]);
  });

  it("returns an empty state when search has no hits", () => {
    const state = getState({
      selectedCategory: "science",
      searchQuery: "rome"
    });

    expect(state.visibleQuizzes).toEqual([]);
    expect(state.hasSearchMatches).toBe(false);
    expect(state.showSearchEmptyState).toBe(true);
    expect(state.matchReasonsById).toEqual({});
  });

  it("supports filtering to the current user's quizzes", () => {
    const state = getState({
      selectedCategory: "your-quizzes"
    });

    expect(state.visibleQuizzes.map((quiz) => quiz._id)).toEqual(["quiz-3", "quiz-1"]);
    expect(state.showSearchEmptyState).toBe(false);
  });

  it("recomputes search results when the active category changes", () => {
    const allState = getState({ searchQuery: "alice" });
    const artOnlyState = getState({
      selectedCategory: "art",
      searchQuery: "alice"
    });

    expect(allState.visibleQuizzes.map((quiz) => quiz._id)).toEqual(["quiz-3", "quiz-1"]);
    expect(artOnlyState.visibleQuizzes.map((quiz) => quiz._id)).toEqual(["quiz-3"]);
  });

  it("recomputes the visible match order when the active sort changes", () => {
    const newestState = getState({ searchQuery: "alice" });
    const oldestState = getState({
      searchQuery: "alice",
      sortDirection: "asc"
    });

    expect(newestState.visibleQuizzes.map((quiz) => quiz._id)).toEqual(["quiz-3", "quiz-1"]);
    expect(oldestState.visibleQuizzes.map((quiz) => quiz._id)).toEqual(["quiz-1", "quiz-3"]);
  });
});
