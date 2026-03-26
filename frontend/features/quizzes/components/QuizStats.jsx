import { useCallback, useEffect } from "react";
import { Button } from "@shared/components/Button";

export function QuizStats({ quiz, onClose }) {
  const closeModal = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  if (!quiz) return null;

  const attempts = quiz.attempts || [];
  const totalAttempts = attempts.length;
  const questionCount = quiz.questions?.length || 0;
  const totalAnswers = quiz.questions?.reduce((sum, question) => sum + (question.answers?.length || 0), 0) || 0;
  const answersPerQuestion = questionCount > 0
    ? (totalAnswers / questionCount).toFixed(1).replace(/\.0$/, "")
    : "0";
  const passThreshold = Number.isFinite(quiz.req_to_pass)
    ? quiz.req_to_pass
    : questionCount;
  const passPercent = questionCount > 0 ? Math.round((passThreshold / questionCount) * 100) : 0;
  const passLabel = questionCount > 0 ? `${passPercent}% (${passThreshold}/${questionCount})` : "0%";

  const passes = attempts.filter(attempt => {
    return attempt.correct >= passThreshold;
  }).length;

  const passRate = totalAttempts > 0 ? Math.round((passes / totalAttempts) * 100) : 0;
  const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const totalQuestions = totalAttempts * questionCount;
  const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const uniqueUsers = new Set(
    attempts.map((attempt) => (attempt.user_id == null ? "unknown-user" : attempt.user_id.toString()))
  ).size;

  const scoreDistribution = {
    excellent: 0, // 80-100%
    good: 0,      // 60-79%
    fair: 0,      // 40-59%
    poor: 0       // 0-39%
  };

  attempts.forEach(attempt => {
    const percentage = questionCount > 0 ? (attempt.correct / questionCount) * 100 : 0;
    if (percentage >= 80) scoreDistribution.excellent++;
    else if (percentage >= 60) scoreDistribution.good++;
    else if (percentage >= 40) scoreDistribution.fair++;
    else scoreDistribution.poor++;
  });

  const authorName = (quiz?.created_by?.authId === "deleted-user" || quiz?.created_by?.user_data?.username === "__deleted__" || quiz?.created_by?.username === "__deleted__")
    ? "deleted user"
    : (quiz?.created_by?.user_data?.username || quiz?.created_by?.username || "Unknown");
  const categoryLabel = quiz?.category
    ? quiz.category.charAt(0).toUpperCase() + quiz.category.slice(1)
    : "Other";
  const difficultyLabel = quiz?.difficulty
    ? quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)
    : "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm dark:bg-slate-950/70 sm:px-6 sm:py-10"
      onClick={closeModal}
      role="presentation"
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800/70 dark:bg-slate-950 sm:bg-white/90 sm:dark:bg-slate-900/95"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="no-scrollbar max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-6 sm:px-7 sm:py-6">
          <div className="space-y-4">
            <div className="mb-1 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-start gap-3">
              <div aria-hidden="true" className="h-10 w-10" />
              <div className="text-center">
                <h2 className="mb-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">Quiz Statistics</h2>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{quiz.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{categoryLabel}</p>
              </div>
              <Button
                onClick={onClose}
                variant="subtle"
                color="standard"
                ariaLabel="Close statistics dialog"
                className="justify-self-end"
                icon={(
                  <svg className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              />
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950 sm:hidden">
              <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Details</h3>
              <div className="divide-y divide-slate-200/80 text-sm text-slate-600 dark:divide-slate-800/70 dark:text-slate-400">
                <div className="flex items-center justify-between py-2">
                  <span>Questions</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{questionCount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Answers per question</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{answersPerQuestion}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Pass threshold</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{passLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Difficulty</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{difficultyLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Created by</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{authorName}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="mb-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  {totalAttempts}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Attempts</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="mb-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  {uniqueUsers}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Unique Users</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="mb-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                    {passRate}%
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Pass Rate</div>
                <div className="mt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
                  {passes} of {totalAttempts} passed
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="mb-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                    {averageScore}%
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Score</div>
                <div className="mt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
                  Across all attempts
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
              <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Score Distribution</h3>
              <div className="space-y-2.5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Excellent (80-100%)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{scoreDistribution.excellent}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.excellent / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-300">Good (60-79%)</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{scoreDistribution.good}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.good / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-300">Fair (40-59%)</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{scoreDistribution.fair}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.fair / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-300">Needs Improvement (0-39%)</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{scoreDistribution.poor}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.poor / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 sm:block">
              <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Details</h3>
              <div className="divide-y divide-slate-200/80 text-sm text-slate-600 dark:divide-slate-800/70 dark:text-slate-400">
                <div className="flex items-center justify-between py-2">
                  <span>Questions</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{questionCount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Answers per question</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{answersPerQuestion}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Pass threshold</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{passLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Difficulty</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{difficultyLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Created by</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {authorName}
                  </span>
                </div>
              </div>
            </div>
            {totalAttempts === 0 && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80">
                  <svg className="h-8 w-8 text-slate-500 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">No Attempts Yet</h3>
                <p className="text-slate-600 dark:text-slate-400">Statistics will appear once users start taking this quiz</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
