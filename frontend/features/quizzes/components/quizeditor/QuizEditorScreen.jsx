import { LogOut } from "lucide-react";
import { PageShell } from "@shared/components/PageShell";
import { PageHeader } from "@shared/components/PageHeader";
import { SelectDropdown } from "@shared/components/SelectDropdown";

function SliderControl({
  label,
  helperLabel,
  valueLabel,
  value,
  min,
  max,
  onChange,
  progressPercent,
}) {
  return (
    <div>
      <label className="block text-slate-600 font-medium mb-2 text-sm">
        {label}
      </label>
      <div className="rounded-xl border border-slate-200/80 bg-white/60 p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{helperLabel}</span>
          <span>{valueLabel}</span>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-900/80">
            <div
              className="h-full bg-slate-800 dark:bg-slate-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            draggable={false}
            min={min}
            max={max}
            step="1"
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="relative z-10 h-1.5 w-full cursor-ew-resize appearance-none bg-transparent touch-none select-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-ew-resize [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-slate-800 [&::-moz-range-thumb]:shadow-sm dark:[&::-moz-range-thumb]:border-slate-950 dark:[&::-moz-range-thumb]:bg-slate-100 [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-ew-resize [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-800 [&::-webkit-slider-thumb]:shadow-sm dark:[&::-webkit-slider-thumb]:border-slate-950 dark:[&::-webkit-slider-thumb]:bg-slate-100"
          />
        </div>
      </div>
    </div>
  );
}

function ToggleControl({
  checked,
  onChange,
  disabled = false,
  title,
  description,
  containerClassName = "",
  inputClassName = "",
}) {
  return (
    <label
      className={`flex items-start gap-3 ${containerClassName} ${disabled ? "cursor-default opacity-50" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className={`mt-1 h-4 w-4 min-h-4 min-w-4 shrink-0 appearance-none rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 checked:bg-slate-800 dark:checked:bg-slate-200 checked:border-transparent transition-all relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white dark:after:border-slate-900 after:border-b-2 after:border-r-2 after:rotate-45 ${disabled ? "cursor-default" : "cursor-pointer"} ${inputClassName}`}
      />
      <span className="text-left text-sm text-slate-700">
        {title}
        <span className="mt-1 block text-xs text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

export function QuizEditorScreen({
  isMobile,
  pageTitle,
  pageSubtitle,
  title,
  onTitleChange,
  category,
  onCategoryChange,
  categories,
  answersPerQuestion,
  answerCountOptions,
  onAnswersPerQuestionChange,
  difficulty,
  difficultyOptions,
  onDifficultyChange,
  passLabel,
  reqToPass,
  questionCount,
  onReqToPassChange,
  allowMultipleCorrect,
  onAllowMultipleCorrectChange,
  requireAllCorrect,
  onRequireAllCorrectChange,
  lockAnswers,
  onLockAnswersChange,
  randomQuestionOrder,
  onRandomQuestionOrderChange,
  onCancel,
  onAddQuestion,
  onSubmit,
  onSignOut,
  cancelLabelMobile,
  cancelLabelDesktop,
  submitLabelMobile,
  submitLabelDesktop,
  submitDisabled = false,
  showQuestionActions,
  isQuestionDragging = false,
  mobileWarning,
  desktopWarning,
  children,
}) {
  const selectedDifficultyIndex = Math.max(
    0,
    difficultyOptions.findIndex((option) => option.value === difficulty)
  );
  const selectedDifficultyOption = difficultyOptions[selectedDifficultyIndex] || difficultyOptions[1];
  const answersProgressPercent = ((answersPerQuestion - answerCountOptions[0]) / (answerCountOptions[answerCountOptions.length - 1] - answerCountOptions[0])) * 100;
  const passProgressPercent = (reqToPass / (questionCount || 1)) * 100;

  return (
    <PageShell>
      {showQuestionActions && isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800/80 pt-[env(safe-area-inset-top)]">
          <div className="px-4 py-2 flex items-center gap-3">
            <div className="grid grid-cols-3 gap-2 flex-1">
              <button
                type="button"
                onClick={onCancel}
                className="bg-white/80 hover:bg-white dark:bg-slate-800/50 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5"
              >
                {cancelLabelMobile}
              </button>
              <button
                type="button"
                onClick={onAddQuestion}
                className="bg-white/80 hover:bg-white dark:bg-slate-800/50 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-xs font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
              <button
                type="submit"
                form="quiz-editor-form"
                disabled={submitDisabled}
                className={`bg-slate-800 dark:bg-blue-950/60 text-white px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 flex items-center justify-center gap-1.5 ${submitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {submitLabelMobile}
              </button>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}
      {showQuestionActions && isMobile && (
        <div aria-hidden="true" className="h-[calc(env(safe-area-inset-top)+3.5rem)] sm:hidden" />
      )}
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />

      <form id="quiz-editor-form" onSubmit={onSubmit} className="space-y-6">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <label className="block text-slate-600 font-medium mb-2 text-sm">
            Title
          </label>
          <input
            type="text"
            placeholder="Enter your quiz title..."
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
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
                    onChange={onCategoryChange}
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
                <SliderControl
                  label="Answers per question"
                  helperLabel="Options per question"
                  valueLabel={`${answersPerQuestion} answers`}
                  value={answersPerQuestion}
                  min={answerCountOptions[0]}
                  max={answerCountOptions[answerCountOptions.length - 1]}
                  onChange={onAnswersPerQuestionChange}
                  progressPercent={answersProgressPercent}
                />
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
                            onClick={() => onDifficultyChange(option.value)}
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
                <SliderControl
                  label="Pass threshold"
                  helperLabel="Required correct answers"
                  valueLabel={passLabel}
                  value={reqToPass}
                  min={0}
                  max={questionCount}
                  onChange={onReqToPassChange}
                  progressPercent={passProgressPercent}
                />
                <div className="space-y-3 select-none">
                  <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 divide-y divide-slate-200/80 dark:divide-slate-800/80 transition-colors hover:border-slate-300/80">
                    <ToggleControl
                      checked={allowMultipleCorrect}
                      onChange={onAllowMultipleCorrectChange}
                      title="Allow multiple correct answers"
                      description="Enables selecting more than one correct answer per question."
                      containerClassName="p-3"
                    />
                    <ToggleControl
                      checked={requireAllCorrect}
                      onChange={onRequireAllCorrectChange}
                      disabled={!allowMultipleCorrect}
                      title="Require all correct answers"
                      description="Mark correct only if the selection matches the full correct set."
                      containerClassName="p-3"
                    />
                  </div>
                </div>
                <ToggleControl
                  checked={lockAnswers}
                  onChange={onLockAnswersChange}
                  title="Lock answers after Next"
                  description="You can go back to review, but answers cannot be changed."
                  containerClassName="rounded-xl border border-slate-200/80 bg-white/60 p-3 hover:border-slate-300/80 transition-all"
                />
                <ToggleControl
                  checked={randomQuestionOrder}
                  onChange={onRandomQuestionOrderChange}
                  title="Questions in random order"
                  description="Shuffle the question order for each quiz attempt."
                  containerClassName="rounded-xl border border-slate-200/80 bg-white/60 p-3 hover:border-slate-300/80 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {children}

        {mobileWarning}

        {showQuestionActions && (
          <div className={`sticky bottom-6 z-20 pt-4 hidden sm:block ${isQuestionDragging ? "pointer-events-none" : ""}`}>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-lg shadow-lg px-4 py-4 sm:px-6">
              {desktopWarning}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 bg-white/70 hover:bg-white/90 dark:bg-slate-800/40 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 backdrop-blur-lg text-slate-700 px-6 py-3 rounded-xl font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-2"
                >
                  {cancelLabelDesktop}
                </button>
                <button
                  type="button"
                  onClick={onAddQuestion}
                  className="flex-1 bg-white/70 hover:bg-white/90 dark:bg-slate-800/40 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100 backdrop-blur-lg text-slate-700 px-6 py-3 rounded-xl font-semibold border border-slate-200/80 hover:border-slate-300/80 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className={`flex-1 bg-slate-800 dark:bg-blue-950/60 text-white px-6 py-3 rounded-xl font-semibold transition-colors hover:bg-slate-700 dark:hover:bg-blue-900/60 dark:border dark:border-blue-400/30 flex items-center justify-center gap-2 ${submitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {submitLabelDesktop}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </PageShell>
  );
}
