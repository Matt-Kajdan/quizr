function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function FilterChipGroup({
  chips,
  selectedValue,
  onChipClick,
  disabled = false,
  ariaLabel = "Filter options",
  className,
}) {
  return (
    <div
      className={joinClasses(
        "relative min-w-0 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100/80 h-10 dark:border-slate-800/60 dark:bg-slate-800/40",
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="flex h-full items-center gap-1.5 overflow-x-auto overflow-y-hidden p-1 no-scrollbar">
        {chips.map((chip) => {
          const isSelected = chip.value === selectedValue;

          return (
            <button
              key={chip.value}
              type="button"
              disabled={disabled || chip.disabled}
              aria-pressed={isSelected}
              onClick={() => onChipClick?.(chip.value)}
              className={joinClasses(
                "inline-flex h-8 shrink-0 select-none items-center justify-center gap-1.5 rounded-xl border px-4 text-[10px] font-semibold leading-none transition-[background-color,color,border-color] duration-150 sm:text-xs",
                isSelected
                  ? "border-slate-200/80 bg-white text-slate-800 shadow-sm dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100"
                  : "border-transparent text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/40 dark:hover:text-slate-200",
                disabled || chip.disabled
                  ? "cursor-default opacity-50"
                  : "cursor-pointer"
              )}
            >
              {chip.icon && (
                <span aria-hidden="true" className="flex h-3.5 w-3.5 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">
                  {chip.icon}
                </span>
              )}
              <span className="whitespace-nowrap">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
