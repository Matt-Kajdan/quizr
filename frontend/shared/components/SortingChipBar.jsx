import { useEffect, useRef, useState } from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function DirectionArrow({ direction }) {
  const isAsc = direction === "asc";

  return (
    <span className="flex items-center justify-center shrink-0" aria-hidden="true">
      {isAsc ? (
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 5l4 6H6l4-6z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 15l-4-6h8l-4 6z" />
        </svg>
      )}
    </span>
  );
}

export function SortingChipBar({
  chips,
  activeValue,
  direction = "desc",
  onChipClick,
  disabled = false,
  ariaLabel = "Sorting options",
  className,
  showMobileFade = false,
  fillMobile = false,
}) {
  const scrollRef = useRef(null);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateOverflowState = () => {
      setHasHorizontalOverflow(element.scrollWidth > element.clientWidth + 1);
    };

    updateOverflowState();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateOverflowState)
      : null;

    resizeObserver?.observe(element);
    window.addEventListener("resize", updateOverflowState);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [chips, activeValue, direction, fillMobile]);

  return (
    <div
      className={joinClasses(
        "relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100/80 h-10 dark:border-slate-700/60 dark:bg-slate-950",
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 p-1 h-full overflow-x-auto overflow-y-hidden no-scrollbar"
      >
        {chips.map((chip) => {
          const isActive = chip.value === activeValue;
          const widthLabel = chip.reverseLabel && chip.reverseLabel.length > chip.label.length
            ? chip.reverseLabel
            : chip.label;
          const label = isActive && direction === "asc" && chip.reverseLabel
            ? chip.reverseLabel
            : chip.label;

          return (
            <button
              key={chip.value}
              type="button"
              disabled={disabled || chip.disabled}
              aria-pressed={isActive}
              onClick={() => onChipClick?.(chip.value)}
              className={joinClasses(
                "inline-flex h-8 select-none items-center justify-center gap-1.5 rounded-xl border px-4 text-[10px] font-semibold leading-none transition-[background-color,color,transform,box-shadow,border-color] duration-200 active:scale-95 sm:text-xs",
                fillMobile
                  ? "min-w-fit basis-0 grow sm:min-w-0 sm:basis-auto sm:grow-0 sm:shrink-0"
                  : "shrink-0",
                isActive
                  ? "border-slate-200/80 bg-white text-slate-800 shadow-sm dark:border-slate-600/70 dark:bg-slate-800 dark:text-slate-100"
                  : "border-transparent text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200",
                disabled || chip.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <span className="relative grid">
                <span aria-hidden="true" className="invisible whitespace-nowrap">{widthLabel}</span>
                <span className="absolute inset-0 whitespace-nowrap">{label}</span>
              </span>
              {isActive && <DirectionArrow direction={direction} />}
            </button>
          );
        })}
      </div>
      {showMobileFade && hasHorizontalOverflow && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-100/95 to-transparent dark:from-slate-950 sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-100/95 to-transparent dark:from-slate-950 sm:hidden" />
        </>
      )}
    </div>
  );
}
