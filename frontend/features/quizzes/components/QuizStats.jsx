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
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 bg-slate-900/20 backdrop-blur-sm"
      onClick={closeModal}
      role="presentation"
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="no-scrollbar max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-6 sm:px-7 sm:py-6">
          <div className="space-y-4">
            <div className="mb-1 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-start gap-3">
              <div aria-hidden="true" className="h-10 w-10" />
              <div className="text-center">
                <h2 className="mb-1 text-2xl font-semibold text-slate-800">Quiz Statistics</h2>
                <p className="text-sm font-medium text-slate-700">{quiz.title}</p>
                <p className="mt-1 text-xs text-slate-500">{categoryLabel}</p>
              </div>
              <Button
                onClick={onClose}
                variant="subtle"
                color="standard"
                ariaLabel="Close statistics dialog"
                className="justify-self-end"
                icon={(
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm">
                <div className="mb-1 text-2xl font-semibold text-slate-800">
                  {totalAttempts}
                </div>
                <div className="text-xs font-medium text-slate-500">Total Attempts</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm">
                <div className="mb-1 text-2xl font-semibold text-slate-800">
                  {uniqueUsers}
                </div>
                <div className="text-xs font-medium text-slate-500">Unique Users</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm">
                <div className="mb-1 text-2xl font-semibold text-emerald-600">
                    {passRate}%
                </div>
                <div className="text-xs font-medium text-slate-500">Pass Rate</div>
                <div className="mt-1 text-center text-[11px] text-slate-400">
                  {passes} of {totalAttempts} passed
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm">
                <div className="mb-1 text-2xl font-semibold text-amber-600">
                    {averageScore}%
                </div>
                <div className="text-xs font-medium text-slate-500">Average Score</div>
                <div className="mt-1 text-center text-[11px] text-slate-400">
                  Across all attempts
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-slate-800">Score Distribution</h3>
              <div className="space-y-2.5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Excellent (80-100%)</span>
                    <span className="text-emerald-600 font-semibold">{scoreDistribution.excellent}</span>
                  </div>
                  <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.excellent / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">Good (60-79%)</span>
                    <span className="text-sky-600 font-semibold">{scoreDistribution.good}</span>
                  </div>
                  <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.good / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">Fair (40-59%)</span>
                    <span className="text-amber-600 font-semibold">{scoreDistribution.fair}</span>
                  </div>
                  <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.fair / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">Needs Improvement (0-39%)</span>
                    <span className="text-rose-600 font-semibold">{scoreDistribution.poor}</span>
                  </div>
                  <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                      style={{ width: totalAttempts > 0 ? `${(scoreDistribution.poor / totalAttempts) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-slate-800">Details</h3>
              <div className="divide-y divide-slate-200/80 text-sm text-slate-600">
                <div className="flex items-center justify-between py-2">
                  <span>Questions</span>
                  <span className="font-semibold text-slate-800">{questionCount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Answers per question</span>
                  <span className="font-semibold text-slate-800">{answersPerQuestion}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Pass threshold</span>
                  <span className="font-semibold text-slate-800">{passLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Difficulty</span>
                  <span className="font-semibold text-slate-800">{difficultyLabel}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Created by</span>
                  <span className="font-semibold text-slate-800">
                    {authorName}
                  </span>
                </div>
              </div>
            </div>
            {totalAttempts === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Attempts Yet</h3>
                <p className="text-slate-600">Statistics will appear once users start taking this quiz</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
