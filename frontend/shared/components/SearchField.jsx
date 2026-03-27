import { Fragment, forwardRef } from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export const SearchBar = forwardRef(function SearchBar({
  value,
  onChange,
  onClear,
  onEscape,
  onKeyDown,
  className,
  inputClassName,
  clearButtonClassName,
  iconClassName,
  placeholder = "Search",
  isResultsOpen = false,
  isResultsLoading = false,
  results = [],
  emptyResultsMessage = "No results found",
  renderResult,
  renderLoadingResults,
  renderEmptyResults,
  getResultKey,
  resultsPanelClassName,
  ...inputProps
}, ref) {
  function handleKeyDown(event) {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.key !== "Escape") return;

    onEscape?.(event);

    if (!event.defaultPrevented) {
      event.currentTarget.blur();
    }
  }

  const hasValue = Boolean(value);

  return (
    <div className={joinClasses("relative w-full", className)}>
      <span className={joinClasses("pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 dark:text-slate-500", iconClassName)}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
        </svg>
      </span>
      {hasValue && onClear && (
        <button
          type="button"
          aria-label="Clear search"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear}
          className={joinClasses(
            "absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700/60 dark:hover:text-slate-300",
            clearButtonClassName
          )}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
      <input
        {...inputProps}
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={joinClasses(
          "w-full rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 py-2 pl-10 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300/30 dark:focus:ring-white/40 focus:shadow-[0_0_12px_-2px_rgba(100,116,139,0.25)] dark:focus:shadow-[0_0_16px_-2px_rgba(255,255,255,0.15)] transition-all",
          hasValue ? "pr-10" : "pr-4",
          inputClassName
        )}
      />
      {isResultsOpen && (
        <div className={resultsPanelClassName}>
          {isResultsLoading && (
            renderLoadingResults
              ? renderLoadingResults()
              : (
                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300 flex items-center gap-3 h-[60px]">
                  Searching…
                </div>
              )
          )}
          {!isResultsLoading && results.length === 0 && (
            renderEmptyResults
              ? renderEmptyResults()
              : (
                <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-3 h-[60px]">
                  {emptyResultsMessage}
                </div>
              )
          )}
          {!isResultsLoading && renderResult && results.map((result, index) => (
            <Fragment key={getResultKey ? getResultKey(result, index) : index}>
              {renderResult(result, index)}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
});

export const SearchField = SearchBar;
