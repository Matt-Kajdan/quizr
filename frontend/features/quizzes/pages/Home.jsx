import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getQuizzes } from "@features/quizzes/api/quizzes";
import { toggleFavourite } from "@features/quizzes/api/favourites";
import { CATEGORY_ICONS } from "@shared/assets/icons";
import { InfoChip } from "@shared/components/InfoChip";
import { SearchField } from "@shared/components/SearchField";
import { SelectDropdown } from "@shared/components/SelectDropdown";
import { SortingChipBar } from "@shared/components/SortingChipBar";
import {
  formatCategoryLabel,
  getFavouriteCount,
  getHomeQuizViewState
} from "@features/quizzes/utils/homeQuizViewState";
import { useUser } from "@shared/state/useUser";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { toProfileUrl } from "@shared/utils/usernameValidation";

const sortOptions = [
  { value: "newest", label: "Newest", reverseLabel: "Oldest" },
  { value: "stars", label: "Likes" },
  { value: "questions", label: "Questions" },
  { value: "difficulty", label: "Difficulty" }
];

function getQuizAuthorUsername(quiz) {
  const username = quiz?.created_by?.user_data?.username;
  return typeof username === "string" ? username : "";
}

export function Home() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const { favouriteIds, setFavouriteIds, accountUsername, isLoading: isUserLoading } = useUser();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search || ""}`;
  const opalBackdropStyle = {
    backgroundColor: "var(--opal-bg-color)",
    backgroundImage: "var(--opal-backdrop-image)"
  };
  const logoBaseGradient = `
    radial-gradient(160px 120px at 15% 30%, rgba(255, 190, 70, 1), transparent 65%),
    radial-gradient(180px 140px at 45% 20%, rgba(255, 120, 190, 1), transparent 65%),
    radial-gradient(180px 140px at 70% 40%, rgba(90, 180, 255, 1), transparent 65%),
    radial-gradient(200px 150px at 85% 65%, rgba(95, 220, 175, 1), transparent 70%),
    linear-gradient(100deg, rgba(255, 200, 90, 1), rgba(255, 140, 200, 1) 35%, rgba(100, 190, 255, 1) 70%, rgba(105, 230, 185, 1))
  `;
  const logoHoverGradient = `
    linear-gradient(120deg, rgba(215, 55, 165, 1), rgba(235, 175, 55, 1) 38%, rgba(55, 140, 225, 1) 58%, rgba(45, 175, 120, 1))
  `;

  useEffect(() => {
    const fetchQuizzes = async () => {
      // Don't fetch until user context finishes initializing
      if (isUserLoading) return;

      try {
        const data = await getQuizzes();
        setQuizzes(Array.isArray(data?.quizzes) ? data.quizzes : []);
      } catch (error) {
        console.error("Failed to load quizzes", error);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [location.state?.refreshKey, isUserLoading]);

  async function handleToggleFavourite(quizId, isFavourited) {
    const next = !isFavourited;
    setFavouriteIds((prev) =>
      next ? [...prev, quizId] : prev.filter((id) => id !== quizId)
    );
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz._id !== quizId) return quiz;
        const currentCount = getFavouriteCount(quiz);
        const updatedCount = next ? currentCount + 1 : Math.max(0, currentCount - 1);
        return { ...quiz, favourited_count: updatedCount };
      })
    );
    try {
      await toggleFavourite(quizId, isFavourited);
    } catch (error) {
      console.error("Failed to update favourite", error);
      setFavouriteIds((prev) =>
        next ? prev.filter((id) => id !== quizId) : [...prev, quizId]
      );
      setQuizzes((prev) =>
        prev.map((quiz) => {
          if (quiz._id !== quizId) return quiz;
          const currentCount = getFavouriteCount(quiz);
          const updatedCount = next ? Math.max(0, currentCount - 1) : currentCount + 1;
          return { ...quiz, favourited_count: updatedCount };
        })
      );
    }
  }

  const categoryGradients = {
    art: {
      className: "from-pink-500 to-rose-500 dark:bg-pink-500/10 dark:border-pink-500/30 dark:text-pink-400 dark:border",
      hover: { primary: "236 72 153", secondary: "244 63 94" }
    },
    history: {
      className: "from-orange-500 to-amber-500 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400 dark:border",
      hover: { primary: "249 115 22", secondary: "245 158 11" }
    },
    music: {
      className: "from-purple-500 to-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 dark:border",
      hover: { primary: "168 85 247", secondary: "99 102 241" }
    },
    science: {
      className: "from-blue-500 to-cyan-500 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400 dark:border",
      hover: { primary: "59 130 246", secondary: "6 182 212" }
    },
    other: {
      className: "from-gray-500 to-slate-500 dark:bg-slate-500/10 dark:border-slate-500/30 dark:text-slate-400 dark:border",
      hover: { primary: "107 114 128", secondary: "100 116 139" }
    }
  };
  const categoryIcons = CATEGORY_ICONS;
  const difficultyChips = {
    easy: {
      label: "Easy",
      className: "border-emerald-300/50 bg-emerald-400/25 text-emerald-700 hover:border-emerald-200/80 hover:bg-emerald-100/70 hover:text-emerald-700",
      iconPaths: [
        "M5 18c0-6 4.5-11 12-12 1 8-4 13-10 13-1.2 0-2-.3-2-.9z",
        "M8 16c1-3 4-5 8-6",
        "M8 12c1.5 0 3 .5 4.5 1.5"
      ]
    },
    medium: {
      label: "Medium",
      className: "border-amber-400/40 bg-amber-500/20 text-amber-700 hover:border-amber-200/80 hover:bg-amber-100/70 hover:text-amber-700",
      iconPaths: [
        "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
        "M9 15l6-6",
        "M9.5 14.5l1.5-4.5 4.5-1.5-1.5 4.5-4.5 1.5z"
      ]
    },
    hard: {
      label: "Hard",
      className: "border-rose-400/40 bg-rose-500/20 text-rose-700 hover:border-rose-200/80 hover:bg-rose-100/70 hover:text-rose-700",
      iconPaths: [
        "M13 2L4 14h6l-1 8 9-12h-6z"
      ]
    }
  };

  const categories = useMemo(() => [
    "all",
    "favourites",
    ...(accountUsername ? ["your-quizzes"] : []),
    ...new Set(
      quizzes
        .map((quiz) => quiz.category)
        .filter((category) => category && category !== "favourites")
    )
  ], [accountUsername, quizzes]);

  const countLabel = selectedCategory === "all"
    ? "Total Quizzes"
    : selectedCategory === "favourites"
      ? "Favourite Quizzes"
      : selectedCategory === "your-quizzes"
        ? "Your Quizzes"
      : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Quizzes`;

  const getCategoryChipColor = (category) => (
    category === "art"
      ? "pink"
      : category === "history"
        ? "amber"
        : category === "music"
          ? "indigo"
          : category === "science"
            ? "blue"
            : "slate"
  );

  const getDifficultyChipColor = (difficulty) => (
    difficulty === "easy"
      ? "emerald"
      : difficulty === "hard"
        ? "rose"
        : "amber"
  );

  const {
    visibleQuizzes,
    hasSearchMatches,
    showSearchEmptyState,
    matchReasonsById
  } = useMemo(() => getHomeQuizViewState({
    quizzes,
    selectedCategory,
    favouriteIds,
    accountUsername,
    sortBy,
    sortDirection,
    searchQuery
  }), [accountUsername, favouriteIds, quizzes, searchQuery, selectedCategory, sortBy, sortDirection]);

  const handleCardMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--hover-x", `${x}%`);
    event.currentTarget.style.setProperty("--hover-y", `${y}%`);
  };

  const handleCardMouseLeave = (event) => {
    event.currentTarget.style.setProperty("--hover-x", "50%");
    event.currentTarget.style.setProperty("--hover-y", "50%");
  };

  const handleCardTouch = (event) => {
    event.currentTarget.style.transform = 'scale(1.012)';
  };

  const handleCardTouchEnd = (event) => {
    event.currentTarget.style.transform = '';
  };

  const handleLogoMouseMove = (event) => {
    if (isMobile) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    event.currentTarget.style.setProperty("--logo-x", `${x}%`);
    event.currentTarget.style.setProperty("--logo-y", `${y}%`);
  };

  const handleLogoMouseLeave = (event) => {
    event.currentTarget.style.setProperty("--logo-x", "50%");
    event.currentTarget.style.setProperty("--logo-y", "50%");
  };

  if (loading || isUserLoading)
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={opalBackdropStyle}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );

  return (
    <>
      <div className="fixed inset-0 -top-20" style={opalBackdropStyle}></div>
      <div className="fixed inset-0 -top-20 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-amber-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-rose-200/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-[30rem] h-[30rem] -translate-x-1/2 -translate-y-1/2 bg-sky-200/25 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>
      <div className="relative min-h-screen">
        <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-12">
          <div className="mb-8 sm:mb-12 text-center mt-10 sm:mt-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-3 sm:mb-4 animate-fade-in px-4">
              <span
                className={`relative inline-block ${!isMobile ? "group" : ""} select-none`}
                onMouseMove={handleLogoMouseMove}
                onMouseLeave={handleLogoMouseLeave}
                style={{
                  "--logo-x": "50%",
                  "--logo-y": "50%",
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                <span aria-hidden="true" className="absolute" style={{ inset: "-9rem" }}></span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 text-transparent bg-clip-text blur-[20px] opacity-0 group-hover:opacity-65 dark:group-hover:opacity-30 transition-opacity duration-200"
                  style={{
                    backgroundImage: logoBaseGradient,
                    filter: "blur(18px) saturate(1.08) brightness(var(--logo-base-brightness, 0.9))",
                    transform: "translateY(4px) scale(1.03)"
                  }}
                >
                  Quizr.fun
                </span>
                <span
                  className="relative z-10 text-slate-800 dark:text-white"
                  style={{
                    textShadow: "var(--logo-shadow)",
                    WebkitTextStroke: "var(--logo-stroke)"
                  }}
                  data-theme-text="true"
                >
                  Quizr.fun
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 text-transparent bg-clip-text opacity-0 group-hover:opacity-95 dark:group-hover:opacity-100 transition-opacity duration-200 z-20"
                  style={{
                    backgroundImage: logoHoverGradient,
                    backgroundSize: "220% 220%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "var(--logo-x, 50%) var(--logo-y, 50%)",
                    filter: "saturate(1.8) brightness(var(--logo-hover-brightness, 1.06))",
                    mixBlendMode: "normal",
                    WebkitMaskImage: "radial-gradient(180px 120px at var(--logo-x, 50%) calc(var(--logo-y, 50%) + 18%), rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.85) 32%, rgba(0, 0, 0, 0.35) 55%, rgba(0, 0, 0, 0) 78%)",
                    maskImage: "radial-gradient(180px 120px at var(--logo-x, 50%) calc(var(--logo-y, 50%) + 18%), rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.85) 32%, rgba(0, 0, 0, 0.35) 55%, rgba(0, 0, 0, 0) 78%)"
                  }}
                >
                  Quizr.fun
                </span>
              </span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg px-4">Challenge yourself and expand your knowledge</p>
          </div>
          {quizzes.length > 0 && (
            <div className="relative z-30 mb-6 sm:mb-8 overflow-visible rounded-[28px] border border-slate-200/80 bg-white/70 p-3 backdrop-blur-lg shadow-sm">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="flex min-w-0 flex-wrap items-center gap-2.5 xl:flex-none">
                  <InfoChip
                    variant="subtle"
                    size="md"
                    color="slate"
                    className="w-[188px] shrink-0 justify-center px-3.5 text-slate-600 dark:text-slate-200"
                    icon={(
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <rect x="4" y="5" width="16" height="14" rx="2" />
                        <path d="M8 9h8M8 13h5" />
                      </svg>
                    )}
                  >
                    <span className="inline-flex max-w-full items-center gap-1 overflow-hidden">
                      <span className="tabular-nums">{visibleQuizzes.length}</span>
                      <span className="truncate">{countLabel}</span>
                    </span>
                  </InfoChip>
                  <SelectDropdown
                    className="min-w-[180px]"
                    value={selectedCategory}
                    options={categories}
                    onChange={setSelectedCategory}
                    getOptionValue={(category) => category}
                    getOptionLabel={(category) => (
                      category === "all"
                        ? "All Categories"
                        : category === "favourites"
                          ? "Favourites"
                          : category === "your-quizzes"
                            ? "Your quizzes"
                          : category.charAt(0).toUpperCase() + category.slice(1)
                    )}
                    buttonClassName="category-dropdown-button h-10 min-w-[180px] rounded-2xl text-sm font-semibold cursor-pointer inline-flex items-center justify-between px-4 relative active:scale-95 [-webkit-tap-highlight-color:transparent]"
                    menuClassName="z-[70] max-h-64 rounded-2xl [&::-webkit-scrollbar]:hidden"
                    optionClassName="text-xs sm:text-sm font-semibold"
                    itemRoundedClassName="first:rounded-t-2xl last:rounded-b-2xl"
                    renderTrigger={({ isOpen, selectedLabel }) => (
                      <>
                        <span className="truncate pr-4">{selectedLabel}</span>
                        <svg className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  />
                  <SortingChipBar
                  chips={sortOptions}
                  activeValue={sortBy}
                  direction={sortDirection}
                  onChipClick={(nextSortBy) => {
                    if (nextSortBy === sortBy) {
                      setSortDirection((prev) => prev === "desc" ? "asc" : "desc");
                      return;
                    }

                    setSortBy(nextSortBy);
                    setSortDirection("desc");
                  }}
                  showMobileFade
                  className="w-full md:w-auto md:flex-none md:max-w-max"
                  />
                </div>

                <SearchField
                  className="min-w-0 flex-1 xl:min-w-[16rem]"
                  inputClassName="!rounded-2xl py-2.5"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onClear={() => setSearchQuery("")}
                  placeholder="Search quizzes"
                />
              </div>
            </div>
          )}

          {quizzes.length === 0 && (
            <div className="text-center py-12 sm:py-20 max-w-md mx-auto px-4">
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">No Quizzes Yet</h3>
                <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6">
                  Start your learning journey by creating your first quiz
                </p>
                <button className="bg-gradient-to-r from-amber-400 to-rose-400 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-amber-400/40 transition-all transform hover:scale-105 active:scale-95">
                  Create Your First Quiz
                </button>
              </div>
            </div>
          )}
          {quizzes.length > 0 && showSearchEmptyState && (
            <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
              <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/70 p-8 text-center shadow-sm backdrop-blur-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100/90 text-slate-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                    <path d="M8.5 11.5h5" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">No results found</h3>
                <p className="text-sm text-slate-600 sm:text-base">
                  No results for these search criteria.
                </p>
              </div>
            </div>
          )}
          {quizzes.length > 0 && !showSearchEmptyState && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {visibleQuizzes.map((quiz) => {
                const gradient = categoryGradients[quiz.category] || categoryGradients.other;
                const categoryLabel = quiz.category || "other";
                const categoryIcon = categoryIcons[quiz.category] || categoryIcons.other;
                const difficultyKey = difficultyChips[quiz?.difficulty] ? quiz.difficulty : "medium";
                const difficulty = difficultyChips[difficultyKey];
                const isFavourited = favouriteIds.includes(quiz._id);
                const favouriteCount = getFavouriteCount(quiz);
                const authorUsername = getQuizAuthorUsername(quiz);
                const authorIsDeleted = quiz?.created_by?.authId === "deleted-user"
                  || authorUsername === "__deleted__";
                const authorName = authorIsDeleted
                  ? "deleted user"
                  : authorUsername || "Unknown";
                const authorLabel = authorName.length > 24
                  ? `by ${authorName.slice(0, 24)}...`
                  : authorName.length > 16
                    ? `by ${authorName}`
                    : `Created by ${authorName}`;
                const isMyOwnQuiz = !authorIsDeleted
                  && Boolean(accountUsername)
                  && authorUsername === accountUsername;
                const canNavigateToAuthor = !authorIsDeleted && Boolean(authorUsername);
                const matchReasons = matchReasonsById[quiz._id] || [];
                return (
                  <Link
                    key={quiz._id}
                    to={`/quiz/${quiz._id}`}
                    state={{ returnTo }}
                    className="group relative block"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    onTouchStart={handleCardTouch}
                    onTouchEnd={handleCardTouchEnd}
                  >
                    <div
                      className="relative z-10 bg-white/70 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl pt-4 px-4 pb-1.5 sm:pt-5 sm:px-6 sm:pb-2 border border-slate-200/80 hover:border-slate-300 transition-all transform group-hover:scale-[1.012] group-hover:[box-shadow:0_10px_26px_-18px_rgb(var(--shadow-color)/0.42),0_0_18px_-10px_rgb(var(--shadow-color)/0.32)] overflow-hidden h-[200px] flex flex-col"
                      style={{ "--shadow-color": gradient.hover.primary }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-45 transition-opacity blur-2xl"
                        style={{
                          background: `
                          radial-gradient(300px 220px at var(--hover-x, 50%) 110%, rgb(${gradient.hover.primary} / 0.4), transparent 70%),
                          radial-gradient(260px 200px at -6% var(--hover-y, 50%), rgb(${gradient.hover.secondary} / 0.32), transparent 70%),
                          radial-gradient(260px 200px at 106% var(--hover-y, 50%), rgb(${gradient.hover.secondary} / 0.32), transparent 70%)
                        `
                        }}
                      ></div>
                      <div className="relative z-10 flex-1 flex flex-col">
                        {hasSearchMatches && matchReasons.length > 0 && (
                          <div
                            className="-mx-4 -mt-4 mb-3 flex items-center border-b border-slate-200/70 px-4 py-1.5 text-[11px] font-semibold tracking-[0.01em] text-slate-500 dark:border-slate-700/60 dark:text-slate-300 sm:-mx-6 sm:-mt-5 sm:px-6"
                            style={{ backgroundColor: `rgb(${gradient.hover.primary} / 0.08)` }}
                          >
                            {`Matching ${matchReasons.join(", ")}`}
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <InfoChip
                              variant="primary"
                              size="sm"
                              color={getCategoryChipColor(quiz.category)}
                              icon={(
                                <span
                                  className="block h-3.5 w-3.5 bg-current"
                                  style={{
                                    WebkitMaskImage: `url(${categoryIcon})`,
                                    maskImage: `url(${categoryIcon})`,
                                    WebkitMaskSize: "contain",
                                    maskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    maskRepeat: "no-repeat"
                                  }}
                                />
                              )}
                            >
                              {formatCategoryLabel(categoryLabel)}
                            </InfoChip>
                            <InfoChip
                              variant="secondary"
                              size="sm"
                              color={getDifficultyChipColor(quiz.difficulty)}
                              icon={(
                                <svg
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                  className="h-4 w-4 text-current"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  {difficulty.iconPaths.map((path) => (
                                    <path key={path} d={path} />
                                  ))}
                                </svg>
                              )}
                            >
                              {difficulty.label}
                            </InfoChip>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                              {favouriteCount}
                            </span>
                            <button
                              type="button"
                              aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleToggleFavourite(quiz._id, isFavourited);
                              }}
                              className={`inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white/80 p-2 backdrop-blur transition-all duration-150 ease-out group-hover:border-white/30 ${isFavourited
                                ? "text-amber-500 hover:text-slate-700 dark:hover:text-white"
                                : "text-slate-500 hover:text-amber-500 dark:hover:text-amber-500"
                                }`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill={isFavourited ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 3l2.7 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.9 6.5 20.4l1.1-6.3L3 9.6l6.3-.9L12 3Z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center -translate-y-2">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-800 line-clamp-2 transition-all text-center w-full leading-tight">
                            {quiz.title}
                          </h3>
                        </div>
                        <div className="mt-auto -mx-5 sm:-mx-6">
                          <div className="h-px w-full bg-slate-200/70 mb-2"></div>
                          <div className="flex items-center justify-between gap-2 py-0.5 px-4 sm:px-5 text-xs sm:text-sm text-slate-600 dark:group-hover:text-white/90">
                            <InfoChip
                              variant="subtle"
                              size="sm"
                              color="slate"
                              icon={(
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-3.5 w-3.5"
                                >
                                  <path d="M9 2h10a2 2 0 0 1 2 2v10" />
                                  <rect x="3" y="7" width="12" height="14" rx="2" />
                                </svg>
                              )}
                            >
                              {quiz?.questions?.length || 0} questions
                            </InfoChip>
                            {canNavigateToAuthor ? (
                              <InfoChip
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  navigate(toProfileUrl(authorName));
                                }}
                                variant="subtle"
                                size="sm"
                                color="slate"
                                className="hover:[background-color:rgb(var(--shadow-color)/0.2)]"
                              >
                                {isMyOwnQuiz ? "Created by you" : authorLabel}
                              </InfoChip>
                            ) : (
                              <InfoChip
                                variant="subtle"
                                size="sm"
                                color="slate"
                                className="text-slate-400"
                              >
                                {isMyOwnQuiz ? "Created by you" : authorLabel}
                              </InfoChip>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
