const difficultyOrder = { easy: 1, medium: 2, hard: 3 };

function normalizeSearchValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getQuizAuthorUsername(quiz) {
  const username = quiz?.created_by?.user_data?.username;
  return typeof username === "string" ? username : "";
}

export function getFavouriteCount(quiz) {
  return Math.max(
    0,
    quiz.favourited_count ??
      (Array.isArray(quiz.favourites) ? quiz.favourites.length : (quiz.favouritesCount ?? 0))
  );
}

export function formatCategoryLabel(category) {
  if (!category) return "Other";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function getQuizSearchMatchReasons(quiz, query) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return [];

  const reasons = [];

  if (normalizeSearchValue(quiz?.title).includes(normalizedQuery)) {
    reasons.push("title");
  }

  if (normalizeSearchValue(formatCategoryLabel(quiz?.category || "other")).includes(normalizedQuery)) {
    reasons.push("category");
  }

  if (normalizeSearchValue(getQuizAuthorUsername(quiz)).includes(normalizedQuery)) {
    reasons.push("author");
  }

  return reasons;
}

export function getHomeQuizViewState({
  quizzes,
  selectedCategory,
  favouriteIds,
  accountUsername,
  sortBy,
  sortDirection,
  searchQuery
}) {
  const categoryFilteredQuizzes = selectedCategory === "all"
    ? quizzes
    : selectedCategory === "favourites"
      ? quizzes.filter((quiz) => favouriteIds.includes(quiz._id))
      : selectedCategory === "your-quizzes"
        ? quizzes.filter((quiz) => getQuizAuthorUsername(quiz) === accountUsername)
      : quizzes.filter((quiz) => quiz.category === selectedCategory);

  const baseVisibleQuizzes = [...categoryFilteredQuizzes].sort((a, b) => {
    if (sortBy === "stars") {
      return sortDirection === "desc"
        ? getFavouriteCount(b) - getFavouriteCount(a)
        : getFavouriteCount(a) - getFavouriteCount(b);
    }

    if (sortBy === "questions") {
      const getQuestionCount = (quiz) => quiz.questions?.length || 0;
      return sortDirection === "desc"
        ? getQuestionCount(b) - getQuestionCount(a)
        : getQuestionCount(a) - getQuestionCount(b);
    }

    if (sortBy === "difficulty") {
      const getDifficultyRank = (quiz) => difficultyOrder[quiz.difficulty] || 0;
      return sortDirection === "desc"
        ? getDifficultyRank(b) - getDifficultyRank(a)
        : getDifficultyRank(a) - getDifficultyRank(b);
    }

    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
  });

  const normalizedSearchQuery = normalizeSearchValue(searchQuery);

  if (!normalizedSearchQuery) {
    return {
      baseVisibleQuizzes,
      visibleQuizzes: baseVisibleQuizzes,
      hasSearchMatches: false,
      showSearchEmptyState: false,
      matchReasonsById: {}
    };
  }

  const matchReasonsById = {};
  const searchMatches = baseVisibleQuizzes.filter((quiz) => {
    const reasons = getQuizSearchMatchReasons(quiz, normalizedSearchQuery);

    if (reasons.length === 0) return false;

    matchReasonsById[quiz._id] = reasons;
    return true;
  });

  if (searchMatches.length === 0) {
    return {
      baseVisibleQuizzes,
      visibleQuizzes: [],
      hasSearchMatches: false,
      showSearchEmptyState: true,
      matchReasonsById: {}
    };
  }

  return {
    baseVisibleQuizzes,
    visibleQuizzes: searchMatches,
    hasSearchMatches: true,
    showSearchEmptyState: false,
    matchReasonsById
  };
}
