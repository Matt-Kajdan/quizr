import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "@shared/api/apiClient";
import { useAuth } from "@shared/auth/useAuth";
import { toggleFavourite } from "@features/quizzes/api/favourites";
import { Button } from "@shared/components/Button";
import { FilterChipGroup } from "@shared/components/FilterChipGroup";
import { InfoChip } from "@shared/components/InfoChip";
import { InfoChipGroup } from "@shared/components/InfoChipGroup";
import { PageShell } from "@shared/components/PageShell";
import { PageHeader } from "@shared/components/PageHeader";
import { useUser } from "@shared/state/useUser";
import { toProfileUrl } from "@shared/utils/usernameValidation";

function formatScorePercentage(value) {
    if (value == null) return "";
    if (typeof value === "number") return `${Math.round(value)}%`;
    if (typeof value === "string") {
        const numeric = Number.parseFloat(value.replace("%", ""));
        if (!Number.isFinite(numeric)) return value;
        return `${Math.round(numeric)}%`;
    }
    return String(value);
}

function formatCategoryLabel(category) {
    if (!category) return "Other";
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function getCategoryChipColor(category) {
    if (category === "art") return "pink";
    if (category === "history") return "amber";
    if (category === "music") return "indigo";
    if (category === "science") return "blue";
    return "slate";
}

function getDifficultyChipColor(difficulty) {
    if (difficulty === "easy") return "emerald";
    if (difficulty === "hard") return "rose";
    return "amber";
}

function buildQuestionOrder(questions, shouldRandomize) {
    const order = questions.map((_, index) => index);
    if (!shouldRandomize) return order;

    for (let index = order.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    return order;
}

function TakeQuizPage() {
    const user = useAuth();
    //Getting the quiz id from the URL e.g. /quiz/:id
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    //Storing the quiz data from the backend
    const [quiz, setQuiz] = useState(null);
    // Phase of the quiz
    const [phase, setPhase] = useState("intro");
    // Question index
    const [currentIndex, setCurrentIndex] = useState(0);
    //Storing the user's selected answers which is one per question
    const [answers, setAnswers] = useState([]);
    //Storing the result returned after submitting the quiz
    const [result, setResult] = useState(null);
    const [lockedUntil, setLockedUntil] = useState(-1);
    const [questionOrder, setQuestionOrder] = useState([]);
    const { favouriteIds, setFavouriteIds, currentUserId } = useUser();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [summaryFilter, setSummaryFilter] = useState("all");
    const [quizSortConfig, setQuizSortConfig] = useState({
        key: "scorePercentValue",
        direction: "desc"
    });
    const opalBackdropStyle = {
        backgroundColor: "var(--opal-bg-color)",
        backgroundImage: "var(--opal-backdrop-image)"
    };

    const loadQuiz = useCallback(async () => {
        const res = await apiFetch(`/quizzes/${id}`);
        const data = await res.json();
        setQuiz(data.quiz);
    }, [id]);

    useEffect(() => {
        if (!user) return;
        loadQuiz();
    }, [loadQuiz, user]);

    useEffect(() => {
        if (!quiz || !Array.isArray(quiz.questions)) return;
        setQuestionOrder((currentOrder) =>
            currentOrder.length === quiz.questions.length
                ? currentOrder
                : quiz.questions.map((_, index) => index)
        );
    }, [quiz]);

    const isQuizOwner = useMemo(() => {
        if (!quiz || !currentUserId) return false;
        const creatorId = typeof quiz.created_by === "string"
            ? quiz.created_by
            : quiz.created_by?._id;
        return creatorId === currentUserId;
    }, [quiz, currentUserId]);
    const currentUserAttemptCount = useMemo(() => {
        if (!quiz || !currentUserId) return 0;
        const attempts = Array.isArray(quiz.attempts) ? quiz.attempts : [];

        return attempts.filter((attempt) => {
            const userId = typeof attempt.user_id === "string"
                ? attempt.user_id
                : attempt.user_id?._id;
            return userId === currentUserId;
        }).length;
    }, [quiz, currentUserId]);
    const authorUsername = quiz?.created_by?.user_data?.username;
    const authorIsDeleted = quiz?.created_by?.authId === "deleted-user"
        || authorUsername === "__deleted__";
    const authorName = authorIsDeleted
        ? "deleted user"
        : authorUsername || "Unknown";
    const canNavigateToAuthor = !authorIsDeleted && Boolean(authorUsername);
    const returnTo = location.state?.returnTo || "/";
    const baseQuizLeaderboard = useMemo(() => {
        const attempts = Array.isArray(quiz?.attempts) ? quiz.attempts : [];
        const questionsCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
        if (questionsCount === 0 || attempts.length === 0) return [];
        const passThreshold = Number.isFinite(quiz?.req_to_pass) ? quiz.req_to_pass : questionsCount;

        const byUser = new Map();

        attempts.forEach((attempt) => {
            const user = attempt.user_id;
            const userId = typeof user === "string" ? user : user?._id;
            if (!userId) return;
            const username = (typeof user === "object" && user?.user_data?.username) ? user.user_data.username : "Unknown";
            const attemptedAt = attempt.attempted_at ? new Date(attempt.attempted_at) : null;
            const correct = Number.isFinite(attempt.correct) ? attempt.correct : 0;

            const existing = byUser.get(userId);
            if (!existing) {
                byUser.set(userId, {
                    userId,
                    username,
                    attemptsCount: 1,
                    bestCorrect: correct,
                    bestAttemptAt: attemptedAt
                });
                return;
            }

            existing.attemptsCount += 1;
            if (correct > existing.bestCorrect) {
                existing.bestCorrect = correct;
                existing.bestAttemptAt = attemptedAt;
            } else if (correct === existing.bestCorrect) {
                if (attemptedAt && (!existing.bestAttemptAt || attemptedAt < existing.bestAttemptAt)) {
                    existing.bestAttemptAt = attemptedAt;
                }
            }

            if (existing.username === "Unknown" && username !== "Unknown") {
                existing.username = username;
            }
        });

        const entries = Array.from(byUser.values());
        entries.sort((a, b) => {
            if (b.bestCorrect !== a.bestCorrect) return b.bestCorrect - a.bestCorrect;
            if (a.attemptsCount !== b.attemptsCount) return a.attemptsCount - b.attemptsCount;
            const aTime = a.bestAttemptAt ? a.bestAttemptAt.getTime() : Number.POSITIVE_INFINITY;
            const bTime = b.bestAttemptAt ? b.bestAttemptAt.getTime() : Number.POSITIVE_INFINITY;
            if (aTime !== bTime) return aTime - bTime;
            return a.username.localeCompare(b.username, undefined, { sensitivity: "base" });
        });

        return entries.slice(0, 10).map((entry) => {
            const roundedPercent = Math.round((entry.bestCorrect / questionsCount) * 100);
            return {
                ...entry,
                scorePercent: `${roundedPercent}%`,
                scorePercentValue: roundedPercent,
                isPassing: entry.bestCorrect >= passThreshold
            };
        });
    }, [quiz]);

    const quizRankMap = useMemo(() => {
        const map = new Map();
        baseQuizLeaderboard.forEach((entry, index) => {
            map.set(entry.userId, index + 1);
        });
        return map;
    }, [baseQuizLeaderboard]);

    const sortedQuizLeaderboard = useMemo(() => {
        const sorted = [...baseQuizLeaderboard];
        const { key, direction } = quizSortConfig;
        const order = direction === "asc" ? 1 : -1;

        sorted.sort((a, b) => {
            if (key === "rank") {
                const aRank = quizRankMap.get(a.userId) || 0;
                const bRank = quizRankMap.get(b.userId) || 0;
                if (aRank !== bRank) return (aRank - bRank) * order;
                return a.username.localeCompare(b.username);
            }
            if (key === "username") {
                return a.username.localeCompare(b.username) * order;
            }
            const aVal = Number.isFinite(a[key]) ? a[key] : 0;
            const bVal = Number.isFinite(b[key]) ? b[key] : 0;
            if (aVal !== bVal) return (aVal - bVal) * order;
            return a.username.localeCompare(b.username);
        });

        return sorted;
    }, [baseQuizLeaderboard, quizRankMap, quizSortConfig]);

    const quizColumns = [
        { key: "rank", label: "#" },
        { key: "username", label: "Player" },
        {
            key: "scorePercentValue",
            label: "Top score",
            render: (entry) => (
                <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs ${entry.isPassing
                        ? "border-emerald-200/80 bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:border-emerald-800/80 dark:!text-white"
                        : "border-rose-200/80 bg-rose-100/80 text-rose-700 dark:bg-rose-900/60 dark:border-rose-800/80 dark:!text-white"
                        }`}
                >
                    {entry.scorePercent}
                </span>
            )
        },
        { key: "bestCorrect", label: "Correct answers" },
        { key: "attemptsCount", label: "Attempts" }
    ];
    const headerSubtitle = phase === "inProgress"
        ? `Question ${currentIndex + 1} of ${quiz.questions.length}`
        : phase === "done"
            ? `Attempt ${currentUserAttemptCount} - your results`
            : "Ready to take on this quiz?";
    const introSecondaryButtonClass = "w-full sm:h-12 sm:rounded-2xl sm:text-lg";
    const introPrimaryButtonClass = "order-first col-span-2 w-full sm:order-none sm:col-span-1 sm:h-12 sm:rounded-2xl sm:text-lg";

    function handleQuizSort(key) {
        setQuizSortConfig((prev) => {
            if (prev.key === key) {
                return {
                    key,
                    direction: prev.direction === "asc" ? "desc" : "asc"
                };
            }
            const defaultDirection = key === "username" ? "asc" : "desc";
            return { key, direction: defaultDirection };
        });
    }

    function renderQuizSortIcon(key) {
        const isActive = quizSortConfig.key === key;
        const isAsc = quizSortConfig.direction === "asc";
        return (
            <span className="inline-flex w-4 justify-center text-slate-400">
                {isAsc ? (
                    <svg
                        className={`h-3 w-3 ${isActive ? "opacity-100" : "opacity-0"}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M10 5l4 6H6l4-6z" />
                    </svg>
                ) : (
                    <svg
                        className={`h-3 w-3 ${isActive ? "opacity-100" : "opacity-0"}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M10 15l-4-6h8l-4 6z" />
                    </svg>
                )}
            </span>
        );
    }

    const activeQuestions = useMemo(() => {
        if (!quiz || !Array.isArray(quiz.questions)) return [];
        if (questionOrder.length !== quiz.questions.length) return quiz.questions;
        return questionOrder.map((index) => quiz.questions[index]);
    }, [quiz, questionOrder]);

    const summaryItems = useMemo(() => {
        if (!quiz || activeQuestions.length === 0) return [];
        return activeQuestions.map((question, index) => {
            const selection = answers?.[index];
            const selectedIds = Array.isArray(selection)
                ? selection
                : selection
                    ? [selection]
                    : [];
            const selectedSet = new Set(
                selectedIds.map((id) => (id ? id.toString() : "")).filter(Boolean)
            );
            const correctIds = (question.answers || [])
                .filter((answer) => answer.is_correct)
                .map((answer) => (answer._id ? answer._id.toString() : ""))
                .filter(Boolean);
            const correctSet = new Set(correctIds);
            const hasIncorrect = Array.from(selectedSet).some((id) => !correctSet.has(id));
            const hasCorrect = Array.from(selectedSet).some((id) => correctSet.has(id));
            const isCorrect =
                selectedSet.size > 0 &&
                !hasIncorrect &&
                (quiz.require_all_correct ? selectedSet.size === correctSet.size : hasCorrect);
            const missingCorrectIds = Array.from(correctSet).filter((id) => !selectedSet.has(id));
            return {
                questionIndex: index,
                question,
                selectedSet,
                correctSet,
                isCorrect,
                missingCorrectIds
            };
        });
    }, [activeQuestions, answers, quiz]);

    const filteredSummaryItems = useMemo(() => {
        if (summaryFilter === "correct") {
            return summaryItems.filter((item) => item.isCorrect);
        }
        if (summaryFilter === "wrong") {
            return summaryItems.filter((item) => !item.isCorrect);
        }
        return summaryItems;
    }, [summaryItems, summaryFilter]);
    const summaryFilterChips = [
        { value: "all", label: "All" },
        { value: "correct", label: "Correct" },
        { value: "wrong", label: "Incorrect" },
    ];

    const categoryStyles = {
        art: {
            header: "bg-gradient-to-r from-pink-50/90 via-rose-50/80 to-pink-50/90 dark:from-pink-900/30 dark:via-rose-900/20 dark:to-pink-900/30",
            badge: "bg-white/50 dark:bg-pink-900/40 border border-pink-200 dark:border-pink-700/50 text-pink-700 dark:text-pink-300"
        },
        history: {
            header: "bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30",
            badge: "bg-white/50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300"
        },
        music: {
            header: "bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-purple-50/90 dark:from-purple-900/30 dark:via-indigo-900/20 dark:to-purple-900/30",
            badge: "bg-white/50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300"
        },
        science: {
            header: "bg-gradient-to-r from-sky-50/90 via-cyan-50/80 to-blue-50/90 dark:from-sky-900/30 dark:via-cyan-900/20 dark:to-blue-900/30",
            badge: "bg-white/50 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-700/50 text-sky-700 dark:text-sky-300"
        },
        other: {
            header: "bg-slate-100/90 dark:bg-slate-800/50",
            badge: "bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 text-slate-600 dark:text-slate-300"
        }
    };

    const categoryIcons = {
        art: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        ),
        history: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        ),
        music: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        ),
        science: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        ),
        other: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        )
    };

    const difficultyMeta = {
        easy: {
            label: "Easy",
            icon: (
                <>
                    <path d="M5 18c0-6 4.5-11 12-12 1 8-4 13-10 13-1.2 0-2-.3-2-.9z" />
                    <path d="M8 16c1-3 4-5 8-6" />
                    <path d="M8 12c1.5 0 3 .5 4.5 1.5" />
                </>
            )
        },
        medium: {
            label: "Medium",
            icon: (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9 15l6-6" />
                    <path d="M9.5 14.5l1.5-4.5 4.5-1.5-1.5 4.5-4.5 1.5z" />
                </>
            )
        },
        hard: {
            label: "Hard",
            icon: (
                <>
                    <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
                </>
            )
        }
    };

    //While quiz is being loaded or the user is logged out we return a message on the screen
    if (!quiz)
        return (
            <div className="fixed inset-0 flex items-center justify-center" style={opalBackdropStyle}>
                <div className="relative flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600 font-medium">Loading quiz...</p>
                </div>
            </div>
        );

    const question = activeQuestions[currentIndex];
    const isLastQuestion = currentIndex === activeQuestions.length - 1;
    const currentSelections = Array.isArray(answers[currentIndex])
        ? answers[currentIndex]
        : answers[currentIndex]
            ? [answers[currentIndex]]
            : [];
    const isFavourited = favouriteIds.includes(quiz._id);
    const difficultyKey = difficultyMeta[quiz?.difficulty] ? quiz.difficulty : "medium";
    const difficulty = difficultyMeta[difficultyKey];
    const lockAnswers = Boolean(quiz.lock_answers);
    const randomQuestionOrder = Boolean(quiz.random_question_order);
    const optionsPerQuestion = Math.max(
        0,
        ...activeQuestions.map((item) => item.answers.length)
    );
    const passPercent = quiz.questions.length > 0
        ? Math.round((quiz.req_to_pass / quiz.questions.length) * 100)
        : 0;
    const isLocked = lockAnswers && currentIndex <= lockedUntil;
    const activeCategoryStyle = categoryStyles[quiz.category] || categoryStyles.other;

    function handleSelect(answerId) {
        if (result || isLocked) return;
        setAnswers((prev) => {
            const updated = [...prev];
            const current = Array.isArray(updated[currentIndex])
                ? updated[currentIndex]
                : updated[currentIndex]
                    ? [updated[currentIndex]]
                    : [];
            if (quiz.allow_multiple_correct) {
                updated[currentIndex] = current.includes(answerId)
                    ? current.filter((id) => id !== answerId)
                    : [...current, answerId];
            } else {
                updated[currentIndex] = [answerId];
            }
            return updated;
        });
    }

    function goNext() {
        if (currentSelections.length === 0) return;
        if (lockAnswers) {
            setLockedUntil((prev) => Math.max(prev, currentIndex));
        }
        setCurrentIndex((index) => Math.min(index + 1, activeQuestions.length - 1));
    }

    function goBack() {
        setCurrentIndex((index) => Math.max(index - 1, 0));
    }

    function startQuiz() {
        setQuestionOrder(buildQuestionOrder(quiz.questions, randomQuestionOrder));
        setAnswers([]);
        setCurrentIndex(0);
        setResult(null);
        setLockedUntil(-1);
        setPhase("inProgress");
    }

    function retakeQuiz() {
        setQuestionOrder(buildQuestionOrder(quiz.questions, randomQuestionOrder));
        setAnswers([]);
        setCurrentIndex(0);
        setResult(null);
        setLockedUntil(-1);
        setPhase("inProgress");
    }

    function returnToQuiz() {
        setQuestionOrder(quiz.questions.map((_, index) => index));
        setAnswers([]);
        setCurrentIndex(0);
        setResult(null);
        setLockedUntil(-1);
        setPhase("intro");
    }

    async function handleToggleFavourite() {
        const next = !isFavourited;
        setFavouriteIds((prev) =>
            next ? [...prev, quiz._id] : prev.filter((itemId) => itemId !== quiz._id)
        );
        try {
            await toggleFavourite(quiz._id, isFavourited);
        } catch (error) {
            console.error("Failed to update favourite", error);
            setFavouriteIds((prev) =>
                next ? prev.filter((itemId) => itemId !== quiz._id) : [...prev, quiz._id]
            );
        }
    }

    async function handleDeleteQuiz() {
        try {
            const res = await apiFetch(`/quizzes/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                navigate("/");
            } else {
                console.error("Failed to delete quiz");
            }
        } catch (error) {
            console.error("Error deleting quiz:", error);
        }
    }

    async function submitQuiz() {
        //Making sure user is still logged in
        if (!user) return;
        const remappedAnswers = questionOrder.length === quiz.questions.length
            ? questionOrder.reduce((mappedAnswers, originalIndex, displayedIndex) => {
                mappedAnswers[originalIndex] = answers[displayedIndex] ?? [];
                return mappedAnswers;
            }, Array.from({ length: quiz.questions.length }, () => []))
            : answers;
        //Sending the user's answers to the backend
        const res = await apiFetch(`/quizzes/${id}/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ answers: remappedAnswers })
        });
        //Saving the quiz result (percentage, correct answers)
        const data = await res.json();
        setResult(data);
        try {
            await loadQuiz();
        } catch (error) {
            console.error("Failed to refresh quiz data", error);
        }
        setPhase("done");
    }

    return (
        <PageShell>
            <PageHeader
                title={quiz.title}
                subtitle={headerSubtitle}
            />

            {phase === "intro" && (
                        <div className="bg-white/70 backdrop-blur-lg rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className={`px-6 py-4 sm:px-8 ${activeCategoryStyle.header}`}>
                                <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-700 sm:hidden">
                                    <InfoChip
                                        variant="primary"
                                        size="sm"
                                        color={getCategoryChipColor(quiz.category)}
                                        className="shrink-0"
                                        icon={(
                                            <svg className="w-4 h-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {categoryIcons[quiz.category] || categoryIcons.other}
                                            </svg>
                                        )}
                                    >
                                        {formatCategoryLabel(quiz.category)}
                                    </InfoChip>
                                    <InfoChip
                                        variant="secondary"
                                        size="sm"
                                        color={getDifficultyChipColor(difficultyKey)}
                                        className="shrink-0"
                                        icon={(
                                            <svg
                                                className="h-4 w-4 text-current"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.8}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                {difficulty.icon}
                                            </svg>
                                        )}
                                    >
                                        {difficulty.label}
                                    </InfoChip>
                                </div>
                                <div className="mt-3 flex justify-center sm:hidden">
                                    {isQuizOwner ? (
                                        <InfoChipGroup className="mx-auto w-fit max-w-full">
                                            {canNavigateToAuthor ? (
                                                <InfoChip
                                                    onClick={() => {
                                                        navigate(toProfileUrl(authorName));
                                                    }}
                                                    variant="subtle"
                                                    size="sm"
                                                    color="slate"
                                                    className="!rounded-none !border-0 !bg-transparent px-3"
                                                >
                                                    Created by {isQuizOwner ? "you" : authorName}
                                                </InfoChip>
                                            ) : (
                                                <InfoChip
                                                    variant="subtle"
                                                    size="sm"
                                                    color="slate"
                                                    className="!rounded-none !border-0 !bg-transparent px-3 text-slate-500"
                                                >
                                                    Created by {authorName}
                                                </InfoChip>
                                            )}
                                            <InfoChip
                                                onClick={() =>
                                                    navigate(`/quiz/${id}/edit`, {
                                                        state: {
                                                            from: "quiz",
                                                            returnTo: `/quiz/${id}`,
                                                            quizReturnTo: returnTo,
                                                        },
                                                    })
                                                }
                                                variant="subtle"
                                                size="sm"
                                                color="slate"
                                                className="!rounded-none !border-0 !bg-transparent px-3"
                                                icon={(
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M16.862 4.487a2 2 0 112.828 2.828L8.828 18.175a4 4 0 01-1.414.944l-3.536 1.178 1.178-3.536a4 4 0 01.944-1.414L16.862 4.487z"
                                                        />
                                                    </svg>
                                                )}
                                            >
                                                Edit
                                            </InfoChip>
                                            <InfoChip
                                                onClick={() => setShowDeleteConfirm(true)}
                                                variant="subtle"
                                                size="sm"
                                                color="slate"
                                                className="!rounded-none !border-0 !bg-transparent px-3"
                                                icon={(
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                )}
                                            >
                                                Delete
                                            </InfoChip>
                                        </InfoChipGroup>
                                    ) : canNavigateToAuthor ? (
                                        <InfoChip
                                            onClick={() => {
                                                navigate(toProfileUrl(authorName));
                                            }}
                                            variant="subtle"
                                            size="sm"
                                            color="slate"
                                        >
                                            Created by {authorName}
                                        </InfoChip>
                                    ) : (
                                        <InfoChip
                                            variant="subtle"
                                            size="sm"
                                            color="slate"
                                            className="text-slate-500"
                                        >
                                            Created by {authorName}
                                        </InfoChip>
                                    )}
                                </div>
                                <div className="hidden flex-wrap items-center gap-2 sm:flex">
                                    {canNavigateToAuthor ? (
                                        <InfoChip
                                            onClick={() => {
                                                navigate(toProfileUrl(authorName));
                                            }}
                                            variant="subtle"
                                            size="sm"
                                            color="slate"
                                            className="hidden self-start sm:inline-flex sm:self-auto"
                                        >
                                            Created by {isQuizOwner ? "you" : authorName}
                                        </InfoChip>
                                    ) : (
                                        <InfoChip
                                            variant="subtle"
                                            size="sm"
                                            color="slate"
                                            className="hidden self-start text-slate-500 sm:inline-flex sm:self-auto"
                                        >
                                            Created by {authorName}
                                        </InfoChip>
                                    )}
                                    {isQuizOwner && (
                                        <>
                                            <button
                                                className="rounded-xl border border-slate-200/80 bg-white/40 dark:bg-slate-950/40 dark:border-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-white/80 dark:hover:bg-slate-950/60 hover:border-slate-200/80 flex items-center justify-center gap-2"
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/quiz/${id}/edit`, {
                                                        state: {
                                                            from: "quiz",
                                                            returnTo: `/quiz/${id}`,
                                                            quizReturnTo: returnTo,
                                                        },
                                                    })
                                                }
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M16.862 4.487a2 2 0 112.828 2.828L8.828 18.175a4 4 0 01-1.414.944l-3.536 1.178 1.178-3.536a4 4 0 01.944-1.414L16.862 4.487z"
                                                    />
                                                </svg>
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                className="rounded-xl border border-slate-200/80 bg-white/40 dark:bg-slate-950/40 dark:border-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-white/80 dark:hover:bg-slate-950/60 hover:border-slate-200/80 flex items-center justify-center gap-2"
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(true)}
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                                <span>Delete</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 sm:p-8">
                                <div className="mb-5 grid w-full grid-cols-2 items-stretch gap-2.5 sm:mb-6 sm:grid-cols-3 sm:gap-4">
                                    <Button
                                        variant="secondary"
                                        size="compact"
                                        className={introSecondaryButtonClass}
                                        onClick={() => navigate(returnTo)}
                                    >
                                        <span className="inline-flex items-center justify-center gap-2">
                                            <svg
                                                className="hidden h-5 w-5 sm:block"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M10 8l-4 4 4 4" />
                                                <path d="M6 12h8" />
                                                <path d="M14 5h4a1 1 0 011 1v12a1 1 0 01-1 1h-4" />
                                            </svg>
                                            <span>Exit</span>
                                        </span>
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="compact"
                                        className={introPrimaryButtonClass}
                                        onClick={startQuiz}
                                    >
                                        Take the quiz
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="compact"
                                        className={introSecondaryButtonClass}
                                        onClick={handleToggleFavourite}
                                    >
                                        <span className="inline-flex items-center justify-center gap-2">
                                            <svg
                                                className="hidden h-5 w-5 sm:block"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                fill={isFavourited ? "currentColor" : "none"}
                                                strokeWidth={2}
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.7 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.9 6.5 20.4l1.1-6.3L3 9.6l6.3-.9L12 3Z" />
                                            </svg>
                                            <span>{isFavourited ? "Remove from favourites" : "Add to favourites"}</span>
                                        </span>
                                    </Button>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 divide-y divide-slate-200/80 dark:divide-slate-800/90 sm:hidden">
                                    <div className="flex items-center justify-between gap-4 py-2">
                                        <span>Questions</span>
                                        <span className="text-right font-semibold text-slate-800 dark:text-slate-100">{quiz.questions.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-2">
                                        <span>Options per question</span>
                                        <span className="text-right font-semibold text-slate-800 dark:text-slate-100">{optionsPerQuestion}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-2">
                                        <span>Pass threshold</span>
                                        <span className="text-right font-semibold text-slate-800 dark:text-slate-100">{passPercent}% ({quiz.req_to_pass}) to pass</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-2">
                                        <span>Multiple correct</span>
                                        <span className="text-right font-semibold text-slate-800 dark:text-slate-100">{quiz.allow_multiple_correct ? "Allowed" : "Single answer"}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-2">
                                        <span>Select all correct</span>
                                        <span className="text-right font-semibold text-slate-800 dark:text-slate-100">{quiz.require_all_correct ? "Required" : "Not required"}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-2">
                                        <span>Answer lock</span>
                                        <span className="text-right font-semibold text-slate-800 dark:text-slate-100">{lockAnswers ? "Locked after Next" : "Can change answers"}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-2">
                                        <span>Question order</span>
                                        <span className="text-right font-semibold text-slate-800 dark:text-slate-100">{randomQuestionOrder ? "Questions in random order" : "Order of questions set"}</span>
                                    </div>
                                </div>
                                <div className="hidden gap-4 text-slate-700 text-sm sm:grid sm:grid-cols-2 sm:text-base">
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/80 px-4 py-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-5 w-5 text-slate-600 dark:text-slate-400"
                                            >
                                                <path d="M9 2h10a2 2 0 0 1 2 2v10" />
                                                <rect x="3" y="7" width="12" height="14" rx="2" />
                                            </svg>
                                        </span>
                                        <div className="text-left pl-1">
                                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">Questions</div>
                                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{quiz.questions.length}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/80 px-4 py-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
                                            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10" />
                                            </svg>
                                        </span>
                                        <div className="text-left pl-1">
                                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">Options per question</div>
                                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{optionsPerQuestion}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/80 px-4 py-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
                                            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                        <div className="text-left pl-1">
                                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">Pass threshold</div>
                                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <span>{passPercent}%</span>
                                                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                    (
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
                                                    <span className="text-slate-800 dark:text-slate-200">{quiz.req_to_pass}</span>
                                                    )
                                                </span>
                                                <span>to pass</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/80 px-4 py-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
                                            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h7l-1.5-1.5m0 0L10 6m-1.5 2.5H21M21 14h-7l1.5 1.5m0 0L14 18m1.5-2.5H3" />
                                            </svg>
                                        </span>
                                        <div className="text-left pl-1">
                                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">Multiple correct</div>
                                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                {quiz.allow_multiple_correct ? "Allowed" : "Single answer"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/80 px-4 py-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
                                            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                        <div className="text-left pl-1">
                                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">Select all correct</div>
                                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                {quiz.require_all_correct ? "Required" : "Not required"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/80 px-4 py-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
                                            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {lockAnswers ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 21h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-10 14h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                )}
                                            </svg>
                                        </span>
                                        <div className="text-left pl-1">
                                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">Answer lock</div>
                                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                {lockAnswers ? "Locked after Next" : "Can change answers"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/80 px-4 py-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
                                            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h13M4 17h13M14 4l3 3-3 3M10 14l-3 3 3 3" />
                                            </svg>
                                        </span>
                                        <div className="text-left pl-1">
                                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">Question order</div>
                                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                {randomQuestionOrder ? "Questions in random order" : "Order of questions set"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {isQuizOwner && (
                                    <>
                                        {showDeleteConfirm && (
                                                <div
                                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
                                                >
                                                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/50 p-6 max-w-md w-full shadow-2xl">
                                                        <div className="flex items-center gap-3 mb-4 text-left">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                                                                <svg
                                                                    className="h-6 w-6 text-rose-600 dark:text-rose-400"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={2}
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className="text-left">
                                                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Delete Quiz</h3>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-600 dark:text-slate-300 mb-6 text-left">
                                                            Are you sure you want to delete &apos;{quiz.title}&apos;? All quiz data, attempts, and leaderboard entries will be permanently removed.
                                                        </p>
                                                        <div className="flex gap-3 text-sm sm:text-base">
                                                            <button
                                                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                type="button"
                                                                onClick={handleDeleteQuiz}
                                                            >
                                                                Delete Quiz
                                                            </button>
                                                            <button
                                                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                type="button"
                                                                onClick={() => setShowDeleteConfirm(false)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                        )}
                                    </>
                                )}
                                <div className="mt-8">
                                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3">Leaderboard</h3>
                                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60">
                                        <div className="overflow-x-auto">
                                        <table className="w-full min-w-[460px] text-[11px] sm:min-w-[520px] sm:text-base">
                                            <thead className="bg-slate-100/70 text-left text-slate-600">
                                                <tr>
                                                    {quizColumns.map((column) => (
                                                        <th
                                                            key={column.key}
                                                            className={`px-2.5 py-1.5 text-left sm:px-4 sm:py-3 ${column.key === "username" ? "w-[150px] max-w-[150px] sm:w-[220px] sm:max-w-[220px]" : ""
                                                                }`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuizSort(column.key)}
                                                                className="inline-flex items-center gap-1 text-left font-semibold text-slate-700 hover:text-slate-900 sm:gap-2"
                                                            >
                                                                <span>{column.label}</span>
                                                                <span className="text-xs text-slate-400">{renderQuizSortIcon(column.key)}</span>
                                                            </button>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/50 text-slate-700">
                                                {sortedQuizLeaderboard.length === 0 ? (
                                                    <tr>
                                                        <td className="px-2.5 py-2 text-center text-slate-500 sm:px-4 sm:py-4" colSpan={quizColumns.length}>
                                                            No attempts yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    sortedQuizLeaderboard.map((entry, index) => (
                                                        <tr key={entry.userId}>
                                                            {quizColumns.map((column) => {
                                                                let cellContent;
                                                                let cellClass = "px-2.5 py-1.5 text-left text-slate-700 sm:px-4 sm:py-3";
                                                                if (column.key === "rank") {
                                                                    cellContent = quizRankMap.get(entry.userId) || index + 1;
                                                                    cellClass = "px-2.5 py-1.5 text-left font-medium text-slate-800 sm:px-4 sm:py-3";
                                                                } else if (column.key === "username") {
                                                                    cellContent = entry.username;
                                                                    cellClass = "px-2.5 py-1.5 text-left font-medium text-slate-800 sm:px-4 sm:py-3";
                                                                } else if (column.render) {
                                                                    cellContent = column.render(entry);
                                                                } else {
                                                                    cellContent = entry[column.key];
                                                                }
                                                                return (
                                                                    <td key={`${entry.userId}-${column.key}`} className={cellClass}>
                                                                        {cellContent}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {phase === "inProgress" && (
                        <div className="bg-white/70 backdrop-blur-lg rounded-3xl border border-slate-200/80 shadow-sm pt-4 sm:pt-5 pb-6 sm:pb-8 px-6 sm:px-8">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 mb-4 pb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <InfoChip
                                        variant="primary"
                                        size="sm"
                                        color={getCategoryChipColor(quiz.category)}
                                        icon={(
                                            <svg className="w-4 h-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {categoryIcons[quiz.category] || categoryIcons.other}
                                            </svg>
                                        )}
                                    >
                                        {formatCategoryLabel(quiz.category)}
                                    </InfoChip>
                                    <InfoChip
                                        variant="secondary"
                                        size="sm"
                                        color={getDifficultyChipColor(difficultyKey)}
                                        icon={(
                                            <svg
                                                className="h-4 w-4 text-current"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.8}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                {difficulty.icon}
                                            </svg>
                                        )}
                                    >
                                        {difficulty.label}
                                    </InfoChip>
                                </div>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 pb-2">{question.text}</h2>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {question.answers.map((answer) => {
                                    const isSelected = currentSelections.includes(answer._id);
                                    return (
                                        <button
                                            key={answer._id}
                                            className={`text-left px-4 py-3 rounded-xl border transition-colors ${isSelected
                                                ? "bg-slate-100/80 border-slate-300 text-slate-900 dark:bg-slate-900/90 dark:border-slate-700/50 dark:text-white"
                                                : "bg-white/60 border-slate-200/80 text-slate-700 dark:bg-slate-900/40 dark:border-slate-800/60 dark:text-slate-300"
                                                } ${isLocked ? "cursor-not-allowed opacity-60" : "hover:bg-slate-100 dark:hover:bg-slate-900/60"}`}
                                            onClick={() => handleSelect(answer._id)}
                                            type="button"
                                            disabled={isLocked}
                                        >
                                            {answer.text}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex gap-3 flex-wrap">
                                <button
                                    className="flex-1 min-w-[160px] px-6 py-3 rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
                                    onClick={returnToQuiz}
                                    type="button"
                                >
                                    <span className="inline-flex items-center justify-center gap-2">
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M10 8l-4 4 4 4" />
                                            <path d="M6 12h8" />
                                            <path d="M14 5h4a1 1 0 011 1v12a1 1 0 01-1 1h-4" />
                                        </svg>
                                        <span>Exit</span>
                                    </span>
                                </button>
                                <button
                                    className="flex-1 min-w-[160px] px-6 py-3 rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors disabled:opacity-50"
                                    onClick={goBack}
                                    disabled={currentIndex === 0}
                                    type="button"
                                >
                                    Back
                                </button>
                                {!isLastQuestion && (
                                    <button
                                        className="flex-1 min-w-[160px] px-6 py-3 rounded-xl bg-slate-800 dark:bg-blue-950/60 text-white font-semibold hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 transition-colors disabled:opacity-50"
                                        onClick={goNext}
                                        disabled={currentSelections.length === 0}
                                        type="button"
                                    >
                                        Next
                                    </button>
                                )}
                                {isLastQuestion && (
                                    <button
                                        className="flex-1 min-w-[160px] px-6 py-3 rounded-xl bg-slate-800 dark:bg-blue-950/60 text-white font-semibold hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 transition-colors disabled:opacity-50"
                                        onClick={submitQuiz}
                                        disabled={currentSelections.length === 0}
                                        type="button"
                                    >
                                        Submit
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {phase === "done" && result && (
                        <div className="relative bg-white/70 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center">
                            <div className="absolute left-4 top-4 flex flex-wrap gap-3">
                                <InfoChip
                                    variant="primary"
                                    size="md"
                                    color={getCategoryChipColor(quiz.category)}
                                    icon={(
                                        <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            {categoryIcons[quiz.category] || categoryIcons.other}
                                        </svg>
                                    )}
                                >
                                    {formatCategoryLabel(quiz.category)}
                                </InfoChip>
                                <InfoChip
                                    variant="secondary"
                                    size="md"
                                    color={getDifficultyChipColor(difficultyKey)}
                                    icon={(
                                        <svg
                                            className="w-5 h-5 text-current"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            {difficulty.icon}
                                        </svg>
                                    )}
                                >
                                    {difficulty.label}
                                </InfoChip>
                            </div>
                            <Button
                                onClick={handleToggleFavourite}
                                ariaLabel={isFavourited ? "Remove from favourites" : "Add to favourites"}
                                title={isFavourited ? "Remove from favourites" : "Add to favourites"}
                                variant="secondary"
                                color="standard"
                                className={`absolute right-4 top-4 ${isFavourited ? "text-amber-500" : undefined}`}
                                icon={(
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill={isFavourited ? "currentColor" : "none"} strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.7 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.9 6.5 20.4l1.1-6.3L3 9.6l6.3-.9L12 3Z" />
                                    </svg>
                                )}
                            />
                            {result.correctAnswers >= quiz.req_to_pass ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center border border-emerald-200/80">
                                        <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-2">Quiz Passed</h2>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-rose-100 rounded-full mx-auto mb-4 flex items-center justify-center border border-rose-200/80">
                                        <svg className="w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-2">Quiz Failed</h2>
                                </>
                            )}
                            <p className="text-slate-600 text-lg">
                                {result.correctAnswers} correct {result.correctAnswers === 1 ? 'answer' : 'answers'} ({formatScorePercentage(result.scorePercentage)})
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                                {quiz.req_to_pass} correct {quiz.req_to_pass === 1 ? 'answer' : 'answers'} ({Math.round((quiz.req_to_pass / quiz.questions.length) * 100)}%) required to pass
                            </p>
                            {difficultyKey !== "hard" && (
                                <div className="mt-6 text-left">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Answer summary</h3>
                                        <FilterChipGroup
                                            chips={summaryFilterChips}
                                            selectedValue={summaryFilter}
                                            ariaLabel="Filter answer summary"
                                            className="w-fit"
                                            onChipClick={setSummaryFilter}
                                        />
                                    </div>
                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                        {filteredSummaryItems.length === 0 ? (
                                            <div className="rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
                                                No answers match this filter.
                                            </div>
                                        ) : (
                                            filteredSummaryItems.map((item, index) => {
                                                const statusClasses = item.isCorrect
                                                    ? "border-emerald-300/90 bg-emerald-100/90 dark:bg-emerald-900/40 dark:border-emerald-800/60"
                                                    : "border-rose-300/90 bg-rose-100/90 dark:bg-rose-900/40 dark:border-rose-800/60";
                                                return (
                                                    <div
                                                        key={item.question._id || index}
                                                        className={`rounded-2xl border ${statusClasses} px-4 py-3`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                                                                <InfoChip
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    color="slate"
                                                                    className="px-2 py-0.5"
                                                                >
                                                                    Q{item.questionIndex + 1}
                                                                </InfoChip>
                                                                <span>{item.question.text}</span>
                                                            </div>
                                                            <InfoChip
                                                                variant="primary"
                                                                size="sm"
                                                                color={item.isCorrect ? "emerald" : "rose"}
                                                                className={item.isCorrect
                                                                    ? "border-emerald-300/90 bg-emerald-200/90 text-emerald-800 dark:bg-emerald-800/60 dark:text-white dark:border-emerald-700/50"
                                                                    : "border-rose-300/90 bg-rose-200/90 text-rose-800 dark:bg-rose-800/60 dark:text-white dark:border-rose-700/50"}
                                                            >
                                                                {item.isCorrect ? "Correct" : "Incorrect"}
                                                            </InfoChip>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {item.question.answers.map((answer) => {
                                                                const answerId = answer._id ? answer._id.toString() : "";
                                                                if (!answerId) return null;
                                                                const isSelected = item.selectedSet.has(answerId);
                                                                const isCorrectAnswer = item.correctSet.has(answerId);
                                                                const showMissing = difficultyKey === "easy" && isCorrectAnswer && !isSelected;
                                                                let toneClasses = "border-slate-300/90 dark:border-slate-700 bg-white dark:bg-slate-800/70 text-slate-800 dark:text-slate-300 shadow-sm";
                                                                if (isSelected && isCorrectAnswer) {
                                                                    toneClasses = "border-emerald-700 bg-emerald-700 text-white shadow-lg";
                                                                } else if (isSelected && !isCorrectAnswer) {
                                                                    toneClasses = "border-rose-700 bg-rose-700 text-white shadow-lg";
                                                                } else if (showMissing) {
                                                                    toneClasses = quiz.allow_multiple_correct
                                                                        ? "border-amber-500 bg-amber-500 text-white"
                                                                        : "border-emerald-700 bg-emerald-700 text-white";
                                                                }
                                                                return (
                                                                    <span
                                                                        key={answerId}
                                                                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${toneClasses}`}
                                                                    >
                                                                        {answer.text}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                        {item.selectedSet.size === 0 && (
                                                            <p className="mt-2 text-xs text-slate-500">No answer selected.</p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="mt-6 flex gap-3 flex-wrap">
                                <button
                                    className="flex-1 min-w-[160px] px-6 py-3 rounded-xl bg-white/70 border border-slate-200/80 text-slate-700 font-semibold hover:bg-white/90 transition-colors"
                                    onClick={() => navigate("/")}
                                    type="button"
                                >
                                    Homepage
                                </button>
                                <button
                                    className="flex-1 min-w-[160px] px-6 py-3 rounded-xl bg-slate-800 dark:bg-blue-950/60 text-white font-semibold hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 transition-colors"
                                    onClick={retakeQuiz}
                                    type="button"
                                >
                                    Retake quiz
                                </button>
                                <button
                                    className="flex-1 min-w-[160px] px-6 py-3 rounded-xl bg-white/70 border border-slate-200/80 text-slate-700 font-semibold hover:bg-white/90 transition-colors"
                                    onClick={returnToQuiz}
                                    type="button"
                                >
                                    Return to quiz
                                </button>
                            </div>
                        </div>
                    )}
        </PageShell>
    );
}

export default TakeQuizPage;
