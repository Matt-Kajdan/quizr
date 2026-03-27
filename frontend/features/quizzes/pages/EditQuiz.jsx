import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useLocation, useNavigate, useParams, useBlocker } from "react-router-dom";
import { apiFetch } from "@shared/api/apiClient";
import { useAuth } from "@shared/auth/useAuth";
import { auth } from "@shared/auth/firebase";
import { getQuizById, updateQuiz } from "@features/quizzes/api/quizzes";
import { SortableQuestionList } from "@features/quizzes/components/SortableQuestionList";
import { QuizEditorScreen } from "@features/quizzes/components/quizeditor/QuizEditorScreen";
import {
  stripEditorQuestionIds,
  withEditorQuestionId,
  withEditorQuestionIds,
} from "@features/quizzes/components/questionEditorUtils";
import {
  ANSWER_COUNT_OPTIONS,
  DEFAULT_ANSWERS_PER_QUESTION,
  QUIZ_EDITOR_CATEGORIES,
  QUIZ_EDITOR_CATEGORY_BAR_COLORS,
  QUIZ_EDITOR_DIFFICULTY_OPTIONS,
} from "@features/quizzes/components/quizeditor/quizEditorConfig";
import { useIsMobile } from "@shared/hooks/useIsMobile";

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
  }, [id, navigateToReturn, user]);

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

  if (loading) {
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
  }

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

  const questionCount = questions.length;
  const passPercent = questionCount > 0 ? Math.round((reqToPass / questionCount) * 100) : 0;
  const passLabel = `${reqToPass}/${questionCount} (${passPercent}%)`;
  const resetWarning = initialQuiz ? shouldResetAttempts(initialQuiz, { questions }) : false;
  const quizTitleLabel = title.trim() || "Untitled quiz";
  const questionBarClass = QUIZ_EDITOR_CATEGORY_BAR_COLORS[category] || QUIZ_EDITOR_CATEGORY_BAR_COLORS.other;

  return (
    <QuizEditorScreen
      isMobile={isMobile}
      pageTitle="Edit Quiz"
      pageSubtitle="Refine your quiz details"
      title={title}
      onTitleChange={setTitle}
      category={category}
      onCategoryChange={setCategory}
      categories={QUIZ_EDITOR_CATEGORIES}
      answersPerQuestion={answersPerQuestion}
      answerCountOptions={ANSWER_COUNT_OPTIONS}
      onAnswersPerQuestionChange={handleAnswersPerQuestionChange}
      difficulty={difficulty}
      difficultyOptions={QUIZ_EDITOR_DIFFICULTY_OPTIONS}
      onDifficultyChange={setDifficulty}
      passLabel={passLabel}
      reqToPass={reqToPass}
      questionCount={questionCount}
      onReqToPassChange={setReqToPass}
      allowMultipleCorrect={allowMultipleCorrect}
      onAllowMultipleCorrectChange={handleAllowMultipleCorrectChange}
      requireAllCorrect={requireAllCorrect}
      onRequireAllCorrectChange={setRequireAllCorrect}
      lockAnswers={lockAnswers}
      onLockAnswersChange={setLockAnswers}
      randomQuestionOrder={randomQuestionOrder}
      onRandomQuestionOrderChange={setRandomQuestionOrder}
      onCancel={handleCancel}
      onAddQuestion={addQuestion}
      onSubmit={handleSubmit}
      onSignOut={handleSignOut}
      cancelLabelMobile={hasChanges ? "Discard" : "Cancel"}
      cancelLabelDesktop={hasChanges ? "Discard Changes" : "Cancel"}
      submitLabelMobile="Save"
      submitLabelDesktop="Save Changes"
      submitDisabled={!hasChanges}
      showQuestionActions={questions.length > 0}
      isQuestionDragging={isQuestionDragging}
      mobileWarning={hasChanges && resetWarning ? (
        <div className="mt-3 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-100/80 dark:bg-rose-950/40 px-4 py-3 text-rose-700 dark:text-rose-400 text-sm sm:hidden">
          Saving changes will reset all users&apos; attempts history for this quiz.
        </div>
      ) : null}
      desktopWarning={resetWarning ? (
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-100/80 dark:bg-rose-950/40 px-4 py-3 text-rose-700 dark:text-rose-400 text-sm mb-4">
          Saving changes will reset all users&apos; attempts history for this quiz.
        </div>
      ) : null}
    >
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
    </QuizEditorScreen>
  );
}
