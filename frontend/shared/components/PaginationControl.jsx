import { useEffect, useState } from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  label,
  className
}) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const [hoveredAction, setHoveredAction] = useState(null);

  useEffect(() => {
    if (hoveredAction === "previous" && !canGoPrevious) {
      setHoveredAction(null);
      return;
    }

    if (hoveredAction === "next" && !canGoNext) {
      setHoveredAction(null);
    }
  }, [canGoNext, canGoPrevious, hoveredAction]);

  return (
    <div
      className={joinClasses(
        "relative flex h-11 w-[210px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 text-sm font-medium text-slate-600 backdrop-blur transition-colors dark:border-slate-700/60 dark:bg-slate-950 dark:text-slate-300",
        hoveredAction
          ? "bg-slate-50 border-slate-300 dark:bg-slate-900 dark:border-slate-600"
          : "",
        className
      )}
    >
      <div
        className={joinClasses(
          "pointer-events-none absolute inset-0 transition-colors",
          hoveredAction ? "bg-slate-50 dark:bg-slate-900" : "bg-white/70 dark:bg-slate-950"
        )}
      />
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-14 text-center">
        <span>
          {label ?? `Page ${currentPage} of ${totalPages}`}
        </span>
      </div>
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        onMouseEnter={() => {
          if (canGoPrevious) setHoveredAction("previous");
        }}
        onMouseLeave={() => {
          setHoveredAction((current) => (current === "previous" ? null : current));
        }}
        className={joinClasses(
          "relative z-10 flex h-full flex-1 items-center justify-start px-4 text-slate-700 transition-colors dark:text-slate-100",
          canGoPrevious ? "cursor-pointer" : "cursor-default opacity-40"
        )}
        aria-label="Previous page"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        onMouseEnter={() => {
          if (canGoNext) setHoveredAction("next");
        }}
        onMouseLeave={() => {
          setHoveredAction((current) => (current === "next" ? null : current));
        }}
        className={joinClasses(
          "relative z-10 flex h-full flex-1 items-center justify-end px-4 text-slate-700 transition-colors dark:text-slate-100",
          canGoNext ? "cursor-pointer" : "cursor-default opacity-40"
        )}
        aria-label="Next page"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
