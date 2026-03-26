import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useLocation, useNavigate, useParams, useBlocker } from "react-router-dom";
import { apiFetch } from "@shared/api/apiClient";
import { DIFFICULTY_ICONS } from "@shared/assets/icons";
import { PageShell } from "@shared/components/PageShell";
import { SelectDropdown } from "@shared/components/SelectDropdown";
import { useAuth } from "@shared/auth/useAuth";
import { auth } from "@shared/auth/firebase";
import { getQuizById, updateQuiz } from "@features/quizzes/api/quizzes";
import { SortableQuestionList } from "@features/quizzes/components/SortableQuestionList";
import {
  stripEditorQuestionIds,
  withEditorQuestionId,
  withEditorQuestionIds,
} from "@features/quizzes/components/questionEditorUtils";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { PageHeader } from "@shared/components/PageHeader";
import { LogOut } from "lucide-react";

function normalizeText(value) {
  return value == null ? "" : String(value);
}

function getQuestionMatchKey(question) {
  return normalizeText(question?.text);
}

function questionsMatchForAttemptPreservation(originalQuestion, updatedQuestion) {
  if (normalizeText(originalQuestion?.text) !== normalizeText(updatedQuestion?.text)) {
    return false;
  }

  const originalAnswers = Array.isArray(originalQuestion?.answers)
    ? originalQuestion.answers
    : [];
  const updatedAnswers = Array.isArray(updatedQuestion?.answers)
    ? updatedQuestion.answers
    : [];
  const sharedCount = Math.min(originalAnswers.length, updatedAnswers.length);

  for (let index = 0; index < sharedCount; index += 1) {
    if (normalizeText(originalAnswers[index]?.text) !== normalizeText(updatedAnswers[index]?.text)) {
      return false;
    }
  }

  const originalCorrectIndices = originalAnswers
    .map((answer, index) => (answer?.is_correct ? index : null))
    .filter((index) => index !== null);

  if (originalCorrectIndices.length === 0) {
    return true;
  }

  const remainingOriginalCorrect = originalCorrectIndices.filter(
    (index) => index < updatedAnswers.length
  );

  return remainingOriginalCorrect.some((index) => Boolean(updatedAnswers[index]?.is_correct));
}

function shouldResetAttempts(originalQuiz, updatedData) {
  const originalQuestions = Array.isArray(originalQuiz?.questions)
    ? originalQuiz.questions
    : [];
  const updatedQuestions = Array.isArray(updatedData?.questions)
    ? updatedData.questions
    : [];

  if (originalQuestions.length !== updatedQuestions.length) return true;

  const updatedBuckets = new Map();
  updatedQuestions.forEach((question) => {
    const key = getQuestionMatchKey(question);
    const bucket = updatedBuckets.get(key);
    if (bucket) {
      bucket.push(question);
    } else {
      updatedBuckets.set(key, [question]);
    }
  });

  for (let index = 0; index < originalQuestions.length; index += 1) {
    const originalQuestion = originalQuestions[index];
    const bucketKey = getQuestionMatchKey(originalQuestion);
    const candidateQuestions = updatedBuckets.get(bucketKey);
    if (!candidateQuestions || candidateQuestions.length === 0) {
      return true;
    }

    const matchIndex = candidateQuestions.findIndex((updatedQuestion) =>
      questionsMatchForAttemptPreservation(originalQuestion, updatedQuestion)
    );

    if (matchIndex === -1) {
      return true;
    }

    candidateQuestions.splice(matchIndex, 1);
    if (candidateQuestions.length === 0) {
      updatedBuckets.delete(bucketKey);
    }
  }

  return false;
}

export default function EditQuiz() {
  const user = useAuth();
  const isMobile = useIsMobile();
  const ANSWER_COUNT_OPTIONS = useMemo(() => [2, 3, 4, 5, 6], []);
  const DEFAULT_ANSWERS_PER_QUESTION = 4;
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || `/quiz/${id}`;
  const quizReturnTo = location.state?.quizReturnTo;
  const [loading, setLoading] = useState(true);
  const [initialQuiz, setInitialQuiz] = useState(null);
  const [isQuestionDragging, setIsQuestionDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [difficulty, setDifficulty] = useState("medium");
  const [lockAnswers, setLockAnswers] = useState(false);
  const [randomQuestionOrder, setRandomQuestionOrder] = useState(false);
  const [answersPerQuestion, setAnswersPerQuestion] = useState(
    DEFAULT_ANSWERS_PER_QUESTION
  );
  const [allowMultipleCorrect, setAllowMultipleCorrect] = useState(false);
  const [requireAllCorrect, setRequireAllCorrect] = useState(false);
  const [questions, setQuestions] = useState([
    withEditorQuestionId({
      text: "",
      answers: Array.from({ length: DEFAULT_ANSWERS_PER_QUESTION }, () => ({
        text: "",
        is_correct: false,
      })),
    }),
  ]);
  const [reqToPass, setReqToPass] = useState(1);
  const prevQuestionCountRef = useRef(questions.length);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [ignoreBlocker, setIgnoreBlocker] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const opalBackdropStyle = {
    backgroundColor: "var(--opal-bg-color)",
    backgroundImage: "var(--opal-backdrop-image)"
  };

  const navigateToReturn = useCallback(() => {
    navigate(returnTo, quizReturnTo ? { state: { returnTo: quizReturnTo } } : undefined);
  }, [navigate, returnTo, quizReturnTo]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function loadQuiz() {
      setLoading(true);
      try {
        const [meRes, quizBody] = await Promise.all([
          apiFetch("/users/me"),
          getQuizById(id),
        ]);
        const meBody = await meRes.json();
        const quiz = quizBody.quiz;
        if (!mounted) return;

        const creatorId =
          typeof quiz?.created_by === "string" ? quiz.created_by : quiz?.created_by?._id;
        if (!creatorId || creatorId !== meBody.user?._id) {
          navigateToReturn();
          return;
        }

        setInitialQuiz(quiz);
        setTitle(quiz.title || "");
        setCategory(quiz.category || "other");
        setDifficulty(quiz.difficulty || "medium");
        setAllowMultipleCorrect(Boolean(quiz.allow_multiple_correct));
        setRequireAllCorrect(Boolean(quiz.require_all_correct));
        setLockAnswers(Boolean(quiz.lock_answers));
        setRandomQuestionOrder(Boolean(quiz.random_question_order));
        const questionList = Array.isArray(quiz.questions) ? quiz.questions : [];
        const maxAnswersFromQuestions = Math.max(
          0,
          ...questionList.map((item) => item.answers?.length || 0)
        );
        const maxAnswers = maxAnswersFromQuestions || DEFAULT_ANSWERS_PER_QUESTION;
        const minAnswers = ANSWER_COUNT_OPTIONS[0];
        const maxAllowedAnswers = ANSWER_COUNT_OPTIONS[ANSWER_COUNT_OPTIONS.length - 1];
        const clampedAnswers = Math.min(
          Math.max(maxAnswers, minAnswers),
          maxAllowedAnswers
        );
        const normalizedQuestions = withEditorQuestionIds(questionList.map((question) => ({
          _id: question._id,
          text: question.text || "",
          answers: Array.from({ length: clampedAnswers }, (_, index) => {
            const existing = question.answers?.[index];
            return {
              _id: existing?._id,
              text: existing?.text || "",
              is_correct: Boolean(existing?.is_correct),
            };
          }),
        })));
        const resolvedQuestions = normalizedQuestions.length ? normalizedQuestions : [];
        const resolvedReqToPass = Number.isFinite(quiz.req_to_pass)
          ? Math.min(quiz.req_to_pass, normalizedQuestions.length || 1)
          : 1;
        setAnswersPerQuestion(clampedAnswers);
        setQuestions(resolvedQuestions);
        setReqToPass(resolvedReqToPass);
        prevQuestionCountRef.current = normalizedQuestions.length || 1;
        setInitialSnapshot(
          buildSnapshot({
            title: quiz.title || "",
            category: quiz.category || "other",
            difficulty: quiz.difficulty || "medium",
            lockAnswers: Boolean(quiz.lock_answers),
            randomQuestionOrder: Boolean(quiz.random_question_order),
            allowMultipleCorrect: Boolean(quiz.allow_multiple_correct),
            requireAllCorrect: Boolean(quiz.require_all_correct),
            reqToPass: resolvedReqToPass,
            questions: resolvedQuestions,
          })
        );
      } catch (error) {
        alert(error.message);
        navigateToReturn();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadQuiz();
    return () => {
      mounted = false;
    };
  }, [id, navigateToReturn, user, ANSWER_COUNT_OPTIONS]);

  useEffect(() => {
    const currentCount = questions.length;
    const prevCount = prevQuestionCountRef.current;
    if (currentCount !== prevCount) {
      setReqToPass((prev) =>
        prev === prevCount ? currentCount : Math.min(prev, currentCount)
      );
      prevQuestionCountRef.current = currentCount;
    }
  }, [questions.length]);

  function normalizeAnswerCount(question, count) {
    const answers = Array.isArray(question.answers) ? question.answers : [];
    if (answers.length === count) return question;
    if (answers.length > count) {
      return { ...question, answers: answers.slice(0, count) };
    }
    const extras = Array.from({ length: count - answers.length }, () => ({
      text: "",
      is_correct: false,
    }));
    return { ...question, answers: [...answers, ...extras] };
  }

  function handleQuestionChange(index, value) {
    const updated = [...questions];
    updated[index].text = value;
    setQuestions(updated);
  }

  function handleAnswerChange(qIndex, aIndex, value) {
    const updated = [...questions];
    updated[qIndex].answers[aIndex].text = value;
    setQuestions(updated);
  }

  function setCorrectAnswer(qIndex, aIndex) {
    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== qIndex) return question;
        if (allowMultipleCorrect) {
          const answers = question.answers.map((a, i) =>
            i === aIndex ? { ...a, is_correct: !a.is_correct } : a
          );
          return { ...question, answers };
        }
        const answers = question.answers.map((a, i) => ({
          ...a,
          is_correct: i === aIndex,
        }));
        return { ...question, answers };
      })
    );
  }

  function buildSnapshot(data) {
    const normalizedQuestions = (data.questions || []).map((question) => ({
      text: normalizeText(question?.text),
      answers: (question?.answers || []).map((answer) => ({
        text: normalizeText(answer?.text),
        is_correct: Boolean(answer?.is_correct),
      })),
    }));

    return JSON.stringify({
      title: normalizeText(data.title),
      category: data.category || "other",
      difficulty: data.difficulty || "medium",
      lockAnswers: Boolean(data.lockAnswers),
      randomQuestionOrder: Boolean(data.randomQuestionOrder),
      allowMultipleCorrect: Boolean(data.allowMultipleCorrect),
      requireAllCorrect: data.allowMultipleCorrect ? Boolean(data.requireAllCorrect) : false,
      reqToPass: Number.isFinite(data.reqToPass) ? data.reqToPass : 1,
      questions: normalizedQuestions,
    });
  }

  const currentSnapshot = useMemo(
    () =>
      buildSnapshot({
        title,
        category,
        difficulty,
        lockAnswers,
        randomQuestionOrder,
        allowMultipleCorrect,
        requireAllCorrect,
        reqToPass,
        questions,
      }),
    [
      title,
      category,
      difficulty,
      lockAnswers,
      randomQuestionOrder,
      allowMultipleCorrect,
      requireAllCorrect,
      reqToPass,
      questions,
    ]
  );
  const hasChanges = Boolean(initialSnapshot) && currentSnapshot !== initialSnapshot;

  const blocker = useBlocker(hasChanges && !ignoreBlocker);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const shouldLeave = window.confirm("You have unsaved changes. Discard them?");
    if (shouldLeave) {
      setIgnoreBlocker(true);
      setTimeout(() => blocker.proceed(), 0);
    } else {
      blocker.reset();
    }
  }, [blocker]);

  const handleCancel = useCallback(() => {
    navigateToReturn();
  }, [navigateToReturn]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        handleCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  useEffect(() => {
    if (!hasChanges) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    if (!pendingNavigation || !ignoreBlocker) return;
    navigateToReturn();
  }, [pendingNavigation, ignoreBlocker, navigateToReturn]);

  if (loading)
    return (
      <div
        className="fixed inset-0 -top-20 flex items-center justify-center"
        style={opalBackdropStyle}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );

  if (!user) return null;

  function handleAnswersPerQuestionChange(value) {
    const count = Number(value);
    setAnswersPerQuestion(count);
    setQuestions((prev) => prev.map((question) => normalizeAnswerCount(question, count)));
  }

  function handleAllowMultipleCorrectChange(checked) {
    setAllowMultipleCorrect(checked);
    if (!checked) {
      setRequireAllCorrect(false);
      setQuestions((prev) =>
        prev.map((question) => {
          const firstCorrectIndex = question.answers.findIndex((a) => a.is_correct);
          if (firstCorrectIndex === -1) return question;
          const answers = question.answers.map((a, i) => ({
            ...a,
            is_correct: i === firstCorrectIndex,
          }));
          return { ...question, answers };
        })
      );
    }
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      withEditorQuestionId({
        text: "",
        answers: Array.from({ length: answersPerQuestion }, () => ({
          text: "",
          is_correct: false,
        })),
      }),
    ]);
  }

  function removeQuestion(qIndex) {
    if (questions.length === 1) {
      alert("You must have at least one question");
      return;
    }
    const updated = questions.filter((_, i) => i !== qIndex);
    setQuestions(updated);
  }

  const handleSignOut = async () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm("You have unsaved changes. Discard them and sign out?");
      if (!confirmDiscard) return;
    }
    setIgnoreBlocker(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
      setIgnoreBlocker(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const invalidQuestionIndex = questions.findIndex((question) =>
      question.answers.every((answer) => !answer.is_correct)
    );
    if (invalidQuestionIndex !== -1) {
      alert(`Question ${invalidQuestionIndex + 1} needs at least one correct answer.`);
      return;
    }

    const safeReqToPass = Math.min(Math.max(reqToPass, 0), questions.length);
    const resetAttempts = initialQuiz
      ? shouldResetAttempts(initialQuiz, { questions })
      : false;
    if (resetAttempts) {
      const confirmed = window.confirm(
        "Saving changes will reset all users' attempts history for this quiz. Continue?"
      );
      if (!confirmed) return;
    }

    try {
      const payloadQuestions = stripEditorQuestionIds(questions);
      await updateQuiz(id, {
        title,
        category,
        difficulty,
        questions: payloadQuestions,
        allow_multiple_correct: allowMultipleCorrect,
        require_all_correct: allowMultipleCorrect ? requireAllCorrect : false,
        lock_answers: lockAnswers,
        random_question_order: randomQuestionOrder,
        req_to_pass: safeReqToPass,
      });
      setIgnoreBlocker(true);
      setPendingNavigation(true);
    } catch (err) {
      setIgnoreBlocker(false);
      setPendingNavigation(false);
      alert(err.message);
    }
  }

  const difficultyOptions = [
    {
      value: "easy",
      label: "Easy",
      description: "Review every question after finishing, including the correct answers.",
      gradient: "from-emerald-500/80 via-emerald-500/80 to-emerald-500/80 dark:from-emerald-900/60 dark:via-emerald-900/60 dark:to-emerald-900/60",
      border: "border-emerald-400/50 dark:border-emerald-800/50",
      icon: DIFFICULTY_ICONS.easy,
    },
    {
      value: "medium",
      label: "Medium",
      description: "Review every question after finishing, showing which selections were right or wrong.",
      gradient: "from-amber-400/85 via-amber-400/85 to-amber-400/85 dark:from-amber-900/60 dark:via-amber-900/60 dark:to-amber-900/60",
      border: "border-amber-400/50 dark:border-amber-800/50",
      icon: DIFFICULTY_ICONS.medium,
    },
    {
      value: "hard",
      label: "Hard",
      description: "Only see the total number of correct answers after finishing.",
      gradient: "from-rose-500/85 via-rose-500/85 to-rose-500/85 dark:from-rose-900/60 dark:via-rose-900/60 dark:to-rose-900/60",
      border: "border-rose-400/50 dark:border-rose-800/50",
      icon: DIFFICULTY_ICONS.hard,
    },
  ];
  const categories = [
    { value: "art", label: "Art" },
    { value: "history", label: "History" },
    { value: "music", label: "Music" },
    { value: "science", label: "Science" },
    { value: "other", label: "Other" },
  ];
  const categoryBarColors = {
    art: "bg-rose-200/80 dark:bg-rose-900/60 dark:text-rose-200",
    history: "bg-amber-200/80 dark:bg-amber-900/60 dark:text-amber-200",
    music: "bg-sky-200/80 dark:bg-sky-900/60 dark:text-sky-200",
    science: "bg-emerald-200/80 dark:bg-emerald-900/60 dark:text-emerald-200",
    other: "bg-slate-200/80 dark:bg-slate-800/60 dark:text-slate-200",
  };
  const questionCount = questions.length;
  const passPercent = questionCount > 0 ? Math.round((reqToPass / questionCount) * 100) : 0;
  const passLabel = `${reqToPass}/${questionCount} (${passPercent}%)`;
  const resetWarning = initialQuiz ? shouldResetAttempts(initialQuiz, { questions }) : false;
  const quizTitleLabel = title.trim() || "Untitled quiz";
  const questionBarClass = categoryBarColors[category] || categoryBarColors.other;
  const selectedDifficultyIndex = Math.max(
    0,
    difficultyOptions.findIndex((option) => option.value === difficulty)
  );
  const selectedDifficultyOption = difficultyOptions[selectedDifficultyIndex] || difficultyOptions[1];

  return (
    <>
      <PageShell>
        {/* Mobile Top Bar */}
        {questions.length > 0 && isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800/80 pt-[env(safe-area-inset-top)]">
            <div className="px-4 py-2 flex items-center gap-3">
              <div className="grid grid-cols-3 gap-2 flex-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-white/80 hover:bg-white dark:bg-slate-800/50 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5"
                >
                  {hasChanges ? "Discard" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-white/80 hover:bg-white dark:bg-slate-800/50 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
                <button
                  type="button"
                  disabled={!hasChanges}
                  onClick={(e) => handleSubmit(e)}
                  className={`bg-slate-800 dark:bg-blue-950/60 text-white px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 flex items-center justify-center gap-1.5 ${hasChanges ? "" : "opacity-50 cursor-not-allowed"}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        )}
        {questions.length > 0 && isMobile && (
          <div aria-hidden="true" className="h-[calc(env(safe-area-inset-top)+3.5rem)] sm:hidden" />
        )}
        <PageHeader title="Edit Quiz" subtitle="Refine your quiz details" />

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <label className="block text-slate-600 font-medium mb-2 text-sm">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter your quiz title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:shadow-[0_0_16px_-6px_rgba(148,163,184,0.6)]"
              />

              <div className="mt-6 grid gap-y-4 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-x-3">
                <div>
                  <div className="space-y-4">
                    <div className="relative">
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-2 text-sm">
                    Category
                  </label>
                  <SelectDropdown
                    value={category}
                    options={categories}
                    onChange={setCategory}
                    buttonClassName="w-full rounded-xl px-4 py-3 text-left flex items-center justify-between"
                    menuClassName="max-h-64 rounded-xl"
                    optionClassName="font-medium"
                    itemRoundedClassName="first:rounded-t-xl last:rounded-b-xl"
                    renderTrigger={({ isOpen, selectedOption }) => (
                      <>
                        <span>{selectedOption?.label || category}</span>
                        <svg className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  />
                </div>
                    <div className="relative">
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-2 text-sm">
                        Answers per question
                      </label>
                      <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span>Options per question</span>
                          <span>{answersPerQuestion} answers</span>
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-900/80 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-slate-800 dark:bg-slate-100"
                              style={{ width: `${((answersPerQuestion - ANSWER_COUNT_OPTIONS[0]) / (ANSWER_COUNT_OPTIONS[ANSWER_COUNT_OPTIONS.length - 1] - ANSWER_COUNT_OPTIONS[0])) * 100}%` }}
                            />
                          </div>
                          <input
                            type="range"
                            draggable={false}
                            min={ANSWER_COUNT_OPTIONS[0]}
                            max={ANSWER_COUNT_OPTIONS[ANSWER_COUNT_OPTIONS.length - 1]}
                            step="1"
                            value={answersPerQuestion}
                            onChange={(e) => handleAnswersPerQuestionChange(Number(e.target.value))}
                            className="relative w-full h-1.5 appearance-none bg-transparent cursor-ew-resize z-10 touch-none select-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-ew-resize [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-800 dark:[&::-webkit-slider-thumb]:bg-slate-100 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-950 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-ew-resize [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-slate-800 dark:[&::-moz-range-thumb]:bg-slate-100 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-950 [&::-moz-range-thumb]:shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-2 text-sm">
                        Difficulty
                      </label>
                      <div className="w-full border border-slate-200/80 bg-white/70 rounded-xl p-1">
                        <div className="relative grid grid-cols-3 gap-1">
                          <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-y-0 rounded-lg shadow-sm transition-[left,background-color,border-color] duration-180 ease-out bg-gradient-to-r ${selectedDifficultyOption.gradient} ${selectedDifficultyOption.border}`}
                            style={{
                              left: `calc(${selectedDifficultyIndex} * ((100% - 0.5rem) / 3 + 0.25rem))`,
                              width: "calc((100% - 0.5rem) / 3)"
                            }}
                          />
                          {difficultyOptions.map((option) => {
                            const isActive = difficulty === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setDifficulty(option.value)}
                                aria-pressed={isActive}
                                className={`relative z-10 flex min-h-[42px] select-none items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide transition-colors duration-150 ${isActive
                                  ? "text-white"
                                  : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                                  }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 shrink-0"
                                  style={{
                                    backgroundColor: "currentColor",
                                    maskImage: `url(${option.icon})`,
                                    WebkitMaskImage: `url(${option.icon})`,
                                    maskRepeat: "no-repeat",
                                    WebkitMaskRepeat: "no-repeat",
                                    maskPosition: "center",
                                    WebkitMaskPosition: "center",
                                    maskSize: "contain",
                                    WebkitMaskSize: "contain",
                                  }}
                                />
                                <span>{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-2 px-1 text-sm text-slate-600 min-h-[40px]">
                        {difficultyOptions.map((option) => (
                          <p key={option.value} className={difficulty === option.value ? "block" : "hidden"}>
                            {option.description}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block self-stretch bg-slate-200/80" />
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-600 font-medium mb-2 text-sm">
                        Pass threshold
                      </label>
                      <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span>Required correct answers</span>
                          <span>{passLabel}</span>
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-900/80 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-slate-800 dark:bg-slate-100"
                              style={{ width: `${(reqToPass / (questionCount || 1)) * 100}%` }}
                            />
                          </div>
                          <input
                            type="range"
                            draggable={false}
                            min="0"
                            max={questionCount}
                            step="1"
                            value={reqToPass}
                            onChange={(e) => setReqToPass(Number(e.target.value))}
                            className="relative w-full h-1.5 appearance-none bg-transparent cursor-ew-resize z-10 touch-none select-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-ew-resize [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-800 dark:[&::-webkit-slider-thumb]:bg-slate-100 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-950 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-ew-resize [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-slate-800 dark:[&::-moz-range-thumb]:bg-slate-100 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-950 [&::-moz-range-thumb]:shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 select-none">
                      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 divide-y divide-slate-200/80 dark:divide-slate-800/80 transition-colors hover:border-slate-300/80">
                        <label className="flex items-start gap-3 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowMultipleCorrect}
                        onChange={(e) => handleAllowMultipleCorrectChange(e.target.checked)}
                        className="mt-1 h-4 w-4 min-h-4 min-w-4 shrink-0 appearance-none rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 checked:bg-slate-800 dark:checked:bg-slate-200 checked:border-transparent transition-all cursor-pointer relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white dark:after:border-slate-900 after:border-b-2 after:border-r-2 after:rotate-45"
                      />
                      <span className="text-left text-sm text-slate-700">
                        Allow multiple correct answers
                        <span className="block text-xs text-slate-500 mt-1">
                          Enables selecting more than one correct answer per question.
                        </span>
                        </span>
                        </label>
                        <label
                          className={`flex items-start gap-3 p-3 ${allowMultipleCorrect ? "cursor-pointer" : "cursor-default opacity-50"}`}
                        >
                        <input
                          type="checkbox"
                          checked={requireAllCorrect}
                          onChange={(e) => setRequireAllCorrect(e.target.checked)}
                          disabled={!allowMultipleCorrect}
                          className={`mt-1 h-4 w-4 min-h-4 min-w-4 shrink-0 appearance-none rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 checked:bg-slate-800 dark:checked:bg-slate-200 checked:border-transparent transition-all relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white dark:after:border-slate-900 after:border-b-2 after:border-r-2 after:rotate-45 ${allowMultipleCorrect ? "cursor-pointer" : "cursor-default"
                            }`}
                        />
                        <span className="text-left text-sm text-slate-700">
                          Require all correct answers
                          <span className="block text-xs text-slate-500 mt-1">
                            Mark correct only if the selection matches the full correct set.
                          </span>
                        </span>
                        </label>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/60 p-3 hover:border-slate-300/80 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lockAnswers}
                        onChange={(e) => setLockAnswers(e.target.checked)}
                        className="mt-1 h-4 w-4 min-h-4 min-w-4 shrink-0 appearance-none rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 checked:bg-slate-800 dark:checked:bg-slate-200 checked:border-transparent transition-all cursor-pointer relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white dark:after:border-slate-900 after:border-b-2 after:border-r-2 after:rotate-45"
                      />
                      <span className="text-left text-sm text-slate-700">
                        Lock answers after Next
                        <span className="block text-xs text-slate-500 mt-1">
                          You can go back to review, but answers cannot be changed.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/60 p-3 hover:border-slate-300/80 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={randomQuestionOrder}
                        onChange={(e) => setRandomQuestionOrder(e.target.checked)}
                        className="mt-1 h-4 w-4 min-h-4 min-w-4 shrink-0 appearance-none rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 checked:bg-slate-800 dark:checked:bg-slate-200 checked:border-transparent transition-all cursor-pointer relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white dark:after:border-slate-900 after:border-b-2 after:border-r-2 after:rotate-45"
                      />
                      <span className="text-left text-sm text-slate-700">
                        Questions in random order
                        <span className="block text-xs text-slate-500 mt-1">
                          Shuffle the question order for each quiz attempt.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <SortableQuestionList
              questions={questions}
              setQuestions={setQuestions}
              quizTitleLabel={quizTitleLabel}
              questionBarClass={questionBarClass}
              allowMultipleCorrect={allowMultipleCorrect}
              onQuestionChange={handleQuestionChange}
              onAnswerChange={handleAnswerChange}
              onSetCorrectAnswer={setCorrectAnswer}
              onRemoveQuestion={removeQuestion}
              onDragStateChange={setIsQuestionDragging}
            />

            {hasChanges && resetWarning && (
              <div className="mt-3 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-100/80 dark:bg-rose-950/40 px-4 py-3 text-rose-700 dark:text-rose-400 text-sm sm:hidden">
                Saving changes will reset all users&apos; attempts history for this quiz.
              </div>
            )}

            {questions.length > 0 && (
              <div className={`sticky bottom-6 z-20 pt-4 hidden sm:block ${isQuestionDragging ? "pointer-events-none" : ""}`}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-lg shadow-lg px-4 py-4 sm:px-6">
                  {resetWarning && (
                    <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-100/80 dark:bg-rose-950/40 px-4 py-3 text-rose-700 dark:text-rose-400 text-sm mb-4">
                      Saving changes will reset all users&apos; attempts history for this quiz.
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-white/70 hover:bg-white/90 dark:bg-slate-800/40 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 backdrop-blur-lg text-slate-700 px-6 py-3 rounded-xl font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-2"
                    >
                      {hasChanges ? "Discard Changes" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="flex-1 bg-white/70 hover:bg-white/90 dark:bg-slate-800/40 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 backdrop-blur-lg text-slate-700 px-6 py-3 rounded-xl font-semibold border border-slate-200/80 hover:border-slate-300/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Question
                    </button>
                    <button
                      type="submit"
                      disabled={!hasChanges}
                      className={`flex-1 bg-slate-800 dark:bg-blue-950/60 text-white px-6 py-3 rounded-xl font-semibold transition-colors hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 flex items-center justify-center gap-2 ${hasChanges
                        ? ""
                        : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
      </PageShell>
    </>
  );
}
