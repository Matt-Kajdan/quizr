import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useLocation, useNavigate, useBlocker } from "react-router-dom";
import { createQuiz } from "@features/quizzes/api/quizzes";
import { SortableQuestionList } from "@features/quizzes/components/SortableQuestionList";
import { QuizEditorScreen } from "@features/quizzes/components/quizeditor/QuizEditorScreen";
import {
  stripEditorQuestionIds,
  withEditorQuestionId,
} from "@features/quizzes/components/questionEditorUtils";
import {
  ANSWER_COUNT_OPTIONS,
  DEFAULT_ANSWERS_PER_QUESTION,
  QUIZ_EDITOR_CATEGORIES,
  QUIZ_EDITOR_CATEGORY_BAR_COLORS,
  QUIZ_EDITOR_DIFFICULTY_OPTIONS,
} from "@features/quizzes/components/quizeditor/quizEditorConfig";
import { useAuth } from "@shared/auth/useAuth";
import { auth } from "@shared/auth/firebase";
import { useIsMobile } from "@shared/hooks/useIsMobile";

export default function CreateQuiz() {
  const user = useAuth();
  const isMobile = useIsMobile();
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
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/";
  const [ignoreBlocker, setIgnoreBlocker] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isQuestionDragging, setIsQuestionDragging] = useState(false);

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

  const hasChanges = useMemo(() => {
    const hasQuestionText = questions.some((q) => q.text.trim().length > 0);
    const hasAnswerText = questions.some((q) =>
      q.answers.some((a) => a.text.trim().length > 0 || a.is_correct)
    );
    const hasNonDefaultSettings =
      title.trim().length > 0 ||
      category !== "other" ||
      difficulty !== "medium" ||
      lockAnswers ||
      randomQuestionOrder ||
      answersPerQuestion !== DEFAULT_ANSWERS_PER_QUESTION ||
      allowMultipleCorrect ||
      requireAllCorrect ||
      reqToPass !== 1 ||
      questions.length !== 1;
    return hasQuestionText || hasAnswerText || hasNonDefaultSettings;
  }, [
    title,
    category,
    difficulty,
    lockAnswers,
    randomQuestionOrder,
    answersPerQuestion,
    allowMultipleCorrect,
    requireAllCorrect,
    reqToPass,
    questions,
  ]);

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

  useEffect(() => {
    if (!hasChanges) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleCancel = useCallback(() => {
    navigate(returnTo);
  }, [navigate, returnTo]);

  useEffect(() => {
    if (!pendingNavigation) return;
    navigate(pendingNavigation);
    setPendingNavigation(null);
  }, [navigate, pendingNavigation]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        handleCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  if (!user) return null;

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
    const payloadQuestions = stripEditorQuestionIds(questions);
    try {
      const data = await createQuiz({
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
      const quizId = data?.quiz?._id;
      setIgnoreBlocker(true);
      setPendingNavigation(quizId ? `/quiz/${quizId}` : "/");
    } catch (err) {
      alert(err.message);
    }
  }
  const questionCount = questions.length;
  const passPercent = questionCount > 0 ? Math.round((reqToPass / questionCount) * 100) : 0;
  const passLabel = `${reqToPass}/${questionCount} (${passPercent}%)`;
  const quizTitleLabel = title.trim() || "Untitled quiz";
  const questionBarClass = QUIZ_EDITOR_CATEGORY_BAR_COLORS[category] || QUIZ_EDITOR_CATEGORY_BAR_COLORS.other;

  return (
    <QuizEditorScreen
      isMobile={isMobile}
      pageTitle="Create New Quiz"
      pageSubtitle="Design your own quiz"
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
      cancelLabelMobile="Cancel"
      cancelLabelDesktop="Cancel"
      submitLabelMobile="Create"
      submitLabelDesktop="Create Quiz"
      showQuestionActions={questions.length > 0}
      isQuestionDragging={isQuestionDragging}
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
